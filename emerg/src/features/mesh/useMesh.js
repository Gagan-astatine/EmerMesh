import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

const SIGNAL_SERVER = process.env.REACT_APP_SIGNAL_SERVER || 'http://localhost:4000'
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
}

export function useMesh(roomId) {
    const socketRef = useRef(null)        // Socket.IO connection to signaling server
    const peersRef = useRef({})           // Map of peerId -> RTCPeerConnection
    const channelsRef = useRef({})        // Map of peerId -> RTCDataChannel
    const [connectedPeers, setConnectedPeers] = useState([])
    const [messages, setMessages] = useState([])
    const [meshReady, setMeshReady] = useState(false)
    useEffect(() => {
        if (!roomId) return
        try {
            const cached = localStorage.getItem(`emermesh_history_${roomId}`)
            if (cached) {
                setMessages(JSON.parse(cached))
            }
        } catch (e) {
            console.error('Failed to load cached messages:', e)
        }
    }, [roomId])
    const updateMessages = useCallback((newMessagesCallback) => {
        setMessages(prev => {
            const updated = newMessagesCallback(prev)
            try {
                localStorage.setItem(`emermesh_history_${roomId}`, JSON.stringify(updated))
            } catch (e) {
                console.error('Failed to cache messages:', e)
            }
            return updated
        })
    }, [roomId])
    const addPeer = (peerId) => {
        setConnectedPeers(prev =>
            prev.includes(peerId) ? prev : [...prev, peerId]
        )
    }
    const removePeer = (peerId) => {
        setConnectedPeers(prev => prev.filter(id => id !== peerId))
        delete peersRef.current[peerId]
        delete channelsRef.current[peerId]
    }
    const handleMessage = useCallback((raw, fromId) => {
        try {
            const msg = JSON.parse(raw)
            if (msg.targetId && msg.targetId !== socketRef.current?.id) {
                const relayChannel = channelsRef.current[msg.targetId]
                if (relayChannel?.readyState === 'open') {
                    relayChannel.send(raw)
                }
                return
            }

            if (msg.priority === 'delete-message') {
                setMessages(prev => prev.filter(m => m.id !== msg.content))
                return
            }
            updateMessages(prev => [...prev, { ...msg, fromId, receivedAt: Date.now() }])
        } catch (err) {
            console.error('Failed to parse mesh message:', err)
        }
    }, [updateMessages])
    const createPeerConnection = useCallback((peerId, isInitiator) => {
        const pc = new RTCPeerConnection(ICE_SERVERS)
        peersRef.current[peerId] = pc
        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                socketRef.current?.emit('relay-signal', {
                    targetId: peerId,
                    signal: { type: 'candidate', candidate },
                })
            }
        }

        pc.onconnectionstatechange = () => {
            console.log(`Peer ${peerId} state: ${pc.connectionState}`)
            if (pc.connectionState === 'connected') addPeer(peerId)
            if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                removePeer(peerId)
            }
        }
        if (isInitiator) {
            const channel = pc.createDataChannel('mesh')
            channelsRef.current[peerId] = channel
            channel.onopen = () => {
                console.log(`Data channel open with ${peerId}`)
                addPeer(peerId)
            }
            channel.onmessage = (e) => handleMessage(e.data, peerId)
            channel.onclose = () => removePeer(peerId)
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    socketRef.current?.emit('relay-signal', {
                        targetId: peerId,
                        signal: { type: 'offer', sdp: pc.localDescription },
                    })
                })
        } else {
            pc.ondatachannel = ({ channel }) => {
                channelsRef.current[peerId] = channel
                channel.onopen = () => {
                    console.log(`Data channel open with ${peerId}`)
                    addPeer(peerId)
                }
                channel.onmessage = (e) => handleMessage(e.data, peerId)
                channel.onclose = () => removePeer(peerId)
            }
        }

        return pc
    }, [handleMessage])
    useEffect(() => {
        if (!roomId) return
        const socket = io(SIGNAL_SERVER, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        })
        socketRef.current = socket

        socket.on('connect', () => {
            console.log('Connected to signaling server:', socket.id)
            socket.emit('join-room', roomId)
            setMeshReady(true)
        })

        socket.on('reconnect', (attempt) => {
            console.log('Reconnected to signaling server on attempt:', attempt)
            if (roomId) {
                socket.emit('join-room', roomId)
            }
            setMeshReady(true)
        })

        socket.on('connect_error', (error) => {
            console.error('Signaling connection error:', error.message)
            setMeshReady(false)
        })
        socket.on('existing-peers', (peerIds) => {
            console.log('Existing peers in room:', peerIds)
            peerIds.forEach(peerId => createPeerConnection(peerId, true))
        })
        socket.on('peer-joined', (peerId) => {
            console.log('New peer joined:', peerId)
            createPeerConnection(peerId, false)
        })
        socket.on('signal', async ({ fromId, signal }) => {
            let pc = peersRef.current[fromId]
            if (!pc) pc = createPeerConnection(fromId, false)

            if (signal.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                socket.emit('relay-signal', {
                    targetId: fromId,
                    signal: { type: 'answer', sdp: pc.localDescription },
                })
            } else if (signal.type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
            } else if (signal.type === 'candidate') {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
            }
        })
        socket.on('peer-left', (peerId) => {
            console.log('Peer left:', peerId)
            peersRef.current[peerId]?.close()
            removePeer(peerId)
        })

        socket.on('disconnect', () => {
            console.log('Disconnected from signaling server')
            setMeshReady(false)
        })
        return () => {
            Object.values(peersRef.current).forEach(pc => pc.close())
            peersRef.current = {}
            channelsRef.current = {}
            socket.disconnect()
            setMeshReady(false)
            setConnectedPeers([])
        }
    }, [roomId, createPeerConnection])
    const sendMessage = useCallback((content, priority = 'normal') => {
        const msg = {
            id: crypto.randomUUID(),
            content,
            priority,
            senderId: socketRef.current?.id || 'me',
            timestamp: Date.now(),
        }
        const raw = JSON.stringify(msg)

        let sent = 0
        Object.entries(channelsRef.current).forEach(([, channel]) => {
            if (channel.readyState === 'open') {
                channel.send(raw)
                sent++
            }
        })
        if (priority !== 'delete-message') {
            updateMessages(prev => [...prev, { ...msg, fromId: 'me', receivedAt: Date.now() }])
        }
        return { sent, msg }
    }, [updateMessages])

    const addHistoricalMessages = useCallback((historicalMsgs) => {
        updateMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMsgs = historicalMsgs.filter(m => !existingIds.has(m.id))
            if (newMsgs.length === 0) return prev
            return [...prev, ...newMsgs].sort((a, b) => a.timestamp - b.timestamp)
        })
    }, [updateMessages])

    const removeMessage = useCallback((msgId) => {
        setMessages(prev => prev.filter(m => m.id !== msgId))
        try {
            const cached = localStorage.getItem(`emermesh_history_${roomId}`)
            if (cached) {
                const updated = JSON.parse(cached).filter(m => m.id !== msgId)
                localStorage.setItem(`emermesh_history_${roomId}`, JSON.stringify(updated))
            }
        } catch (e) {}
    }, [roomId])

    return {
        meshReady,
        connectedPeers,
        messages,
        sendMessage,
        removeMessage,
        myId: socketRef.current?.id,
        addHistoricalMessages,
    }
}