import { createContext, useContext, useState, useEffect } from 'react'
import { useMesh } from './useMesh'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../../lib/supabaseClient'

import { getSectorFromCoords } from '../../lib/geo'
import { saveOfflineMessage, getOfflineMessages, clearOfflineMessages } from '../../lib/offlineStore'
import { requestNotificationPermission, showNotification } from '../../lib/notifications'

const MeshContext = createContext(null)

export function MeshProvider({ children }) {
    const { user } = useAuth()
    const [roomId, setRoomId] = useState('global-mesh-room')
    useEffect(() => {
        if (user) {
            requestNotificationPermission()
        }
    }, [user])
    useEffect(() => {
        if (!user) return

        if (!navigator.geolocation) {
            console.warn('Geolocation not supported. Defaulting to global room.')
            setRoomId('global-mesh-room')
            return
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                const sectorRoom = getSectorFromCoords(latitude, longitude)
                console.log(`Resolved local sector room: ${sectorRoom}`)
                setRoomId(sectorRoom)
            },
            (error) => {
                console.warn(`Geolocation error (${error.code}): ${error.message}. Fallback to global room.`)
                setRoomId('global-mesh-room')
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 10000
            }
        )

        return () => navigator.geolocation.clearWatch(watchId)
    }, [user])

    const mesh = useMesh(roomId)
    const [discoveredVolunteers, setDiscoveredVolunteers] = useState({})
    const [activeZones, setActiveZones] = useState([])
    const [myVolunteerStatus, setMyVolunteerStatus] = useState(null) // { active: boolean, skills: string, name: string }
    useEffect(() => {
        if (mesh.messages.length === 0) return
        const newVolunteers = {}
        const newZonesMap = new Map()

        mesh.messages.forEach(msg => {
            if (msg.priority === 'volunteer-status') {
                try {
                    const data = JSON.parse(msg.content)
                    newVolunteers[msg.senderId || msg.fromId] = {
                        ...data,
                        lastSeen: msg.timestamp || Date.now()
                    }
                } catch (e) {  }
            } else if (msg.priority === 'zone-report') {
                try {
                    const data = JSON.parse(msg.content)
                    const id = msg.id || crypto.randomUUID()
                    if (!newZonesMap.has(id)) {
                        newZonesMap.set(id, {
                            id,
                            senderId: msg.senderId || msg.fromId,
                            timestamp: msg.timestamp || Date.now(),
                            ...data
                        })
                    }
                } catch (e) {  }
            }
        })

        setDiscoveredVolunteers(newVolunteers)
        setActiveZones(Array.from(newZonesMap.values()))
        const lastMsg = mesh.messages[mesh.messages.length - 1]
        const isFromMe = lastMsg.fromId === 'me' || lastMsg.senderId === 'me'
        const isRecent = (Date.now() - (lastMsg.timestamp || Date.now())) < 5000

        if (isRecent && !isFromMe) {
            if (lastMsg.priority === 'sos') {
                showNotification('🆘 SOS Emergency Broadcast Received', {
                    body: lastMsg.content,
                })
            } else if (lastMsg.priority === 'zone-report') {
                try {
                    const data = JSON.parse(lastMsg.content)
                    if (data.severity === 'High') {
                        showNotification('⚠️ High Danger Zone Reported Nearby', {
                            body: `${data.type}: ${data.description}`,
                        })
                    }
                } catch (e) {  }
            }
        }
    }, [mesh.messages])
    const sendMessage = async (content, priority = 'normal') => {
        const result = mesh.sendMessage(content, priority)

        const messagePayload = {
            senderId: user?.id,
            roomId,
            content,
            priority,
            timestamp: Date.now(),
        }

        if (!navigator.onLine) {
            console.warn('Offline — message saved to local sync queue')
            saveOfflineMessage(messagePayload)
            return result
        }

        try {
            const { error } = await supabase.from('messages').insert({
                sender_id: user?.id,
                room_id: roomId,
                content,
                priority,
            })
            if (error) throw error
        } catch (err) {
            console.warn('Offline/Error — message saved to local sync queue:', err.message)
            saveOfflineMessage(messagePayload)
        }

        return result
    }
    const sendVolunteerStatus = (active, skills, name) => {
        const payload = { active, skills, name, sector: roomId }
        setMyVolunteerStatus(payload)
        mesh.sendMessage(JSON.stringify(payload), 'volunteer-status')
    }
    const sendZoneReport = async (type, severity, description, lat = null, lng = null) => {
        const payload = { type, severity, description, sector: roomId, lat, lng }
        const result = await sendMessage(JSON.stringify(payload), 'zone-report')
        setActiveZones(prev => [
            ...prev,
            {
                id: result.msg.id,
                senderId: 'me',
                timestamp: Date.now(),
                ...payload
            }
        ])

        if (navigator.onLine && user) {
            try {
                await supabase.from('zones').insert({
                    id: result.msg.id,
                    reported_by: user.id,
                    label: type,
                    description,
                    lat,
                    lng,
                    active: true
                })
            } catch (err) {
                console.error("Failed to save zone to cloud:", err.message)
            }
        }
    }
    useEffect(() => {
        if (!myVolunteerStatus?.active) return

        const interval = setInterval(() => {
            mesh.sendMessage(JSON.stringify(myVolunteerStatus), 'volunteer-status')
        }, 15000) // Broadcast status every 15s

        return () => clearInterval(interval)
    }, [myVolunteerStatus, mesh, roomId])
    const syncOfflineMessages = async () => {
        const queue = getOfflineMessages()
        if (queue.length === 0) return

        console.log(`Syncing ${queue.length} offline messages to cloud...`)
        try {
            const inserts = queue.map(msg => ({
                sender_id: msg.senderId,
                room_id: msg.roomId,
                content: msg.content,
                priority: msg.priority,
                created_at: new Date(msg.timestamp).toISOString(),
            }))

            const { error } = await supabase.from('messages').insert(inserts)
            if (error) throw error

            clearOfflineMessages()
            console.log('Successfully synchronized offline messages with Supabase.')
        } catch (err) {
            console.error('Failed to sync offline queue:', err.message)
        }
    }
    useEffect(() => {
        if (!user) return

        window.addEventListener('online', syncOfflineMessages)
        if (navigator.onLine) {
            syncOfflineMessages()
        }

        return () => {
            window.removeEventListener('online', syncOfflineMessages)
        }
    }, [user]) // removed mesh.addHistoricalMessages from deps to avoid loop if not needed, but we don't use it here anyway
    useEffect(() => {
        if (!roomId || !user) return

        const fetchHistory = async () => {
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('room_id', roomId)
                    .order('created_at', { ascending: false })
                    .limit(50)
                
                if (error) throw error
                if (data && data.length > 0) {
                    const formatted = data.map(row => ({
                        id: row.id,
                        content: row.content,
                        priority: row.priority,
                        senderId: row.sender_id,
                        fromId: row.sender_id === user.id ? 'me' : row.sender_id,
                        timestamp: new Date(row.created_at).getTime(),
                    }))
                    mesh.addHistoricalMessages(formatted)
                }
            } catch (err) {
                console.error('Failed to fetch history:', err.message)
            }
        }
        
        fetchHistory()
        const channel = supabase.channel(`room:${roomId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `room_id=eq.${roomId}`
            }, payload => {
                const row = payload.new
                mesh.addHistoricalMessages([{
                    id: row.id,
                    content: row.content,
                    priority: row.priority,
                    senderId: row.sender_id,
                    fromId: row.sender_id === user.id ? 'me' : row.sender_id,
                    timestamp: new Date(row.created_at).getTime(),
                }])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, user])

    const getLocationWithTimeout = (timeoutMs = 5000) => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) return resolve(null)
            
            let resolved = false
            const timeout = setTimeout(() => {
                if (!resolved) { resolved = true; resolve(null) }
            }, timeoutMs)

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    if (!resolved) {
                        resolved = true
                        clearTimeout(timeout)
                        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                    }
                },
                () => {
                    if (!resolved) {
                        resolved = true
                        clearTimeout(timeout)
                        resolve(null)
                    }
                },
                { enableHighAccuracy: true, maximumAge: 0 }
            )
        })
    }
    const sendSOS = async (text) => {
        const coords = await getLocationWithTimeout(5000)
        const payload = JSON.stringify({ text, lat: coords?.lat, lng: coords?.lng })
        
        const result = mesh.sendMessage(payload, 'sos')

        const messagePayload = {
            senderId: user?.id,
            roomId,
            content: payload,
            priority: 'sos',
            timestamp: Date.now(),
        }

        if (!navigator.onLine) {
            console.warn('Offline — SOS saved to local sync queue')
            saveOfflineMessage(messagePayload)
            return result
        }

        try {
            const { error } = await supabase.from('messages').insert({
                sender_id: user?.id,
                room_id: roomId,
                content: payload,
                priority: 'sos',
            })
            if (error) throw error
        } catch (err) {
            console.warn('Offline/Error — SOS saved to local sync queue:', err.message)
            saveOfflineMessage(messagePayload)
        }

        return result
    }

    const deleteMessage = async (msgId) => {
        mesh.sendMessage(msgId, 'delete-message')
        mesh.removeMessage(msgId)
        if (navigator.onLine && user) {
            try {
                await supabase.from('messages').delete().eq('id', msgId).eq('sender_id', user.id)
                await supabase.from('zones').delete().eq('id', msgId).eq('reported_by', user.id)
            } catch (err) {
                console.error("Failed to delete from cloud:", err.message)
            }
        }
    }

    return (
        <MeshContext.Provider value={{
            ...mesh,
            roomId,
            setRoomId,
            sendSOS,
            sendMessage,
            deleteMessage,
            syncOfflineMessages,
            discoveredVolunteers,
            sendVolunteerStatus,
            myVolunteerStatus,
            activeZones,
            sendZoneReport,
        }}>
            {children}
        </MeshContext.Provider>
    )
}

export function useMeshContext() {
    const ctx = useContext(MeshContext)
    if (!ctx) throw new Error('useMeshContext must be used inside MeshProvider')
    return ctx
}