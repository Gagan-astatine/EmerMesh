import { useState } from 'react'
import { useMeshContext } from '../mesh/MeshContext'
import { Map, ShieldAlert, Navigation, MapPin, Trash2 } from 'lucide-react'
import MapNavigation from '../../components/MapNavigation'

export default function ZonesPage() {
    const { activeZones, sendZoneReport, roomId, deleteMessage } = useMeshContext()
    const [type, setType] = useState('Flooding')
    const [severity, setSeverity] = useState('High')
    const [description, setDescription] = useState('')

    const [navTarget, setNavTarget] = useState(null)
    const [useLocation, setUseLocation] = useState(false)
    const [isLocating, setIsLocating] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!description.trim()) return

        if (useLocation) {
            setIsLocating(true)
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    sendZoneReport(type, severity, description, pos.coords.latitude, pos.coords.longitude)
                    resetForm()
                },
                (err) => {
                    console.error("Failed to get location:", err)

                    sendZoneReport(type, severity, description, null, null)
                    resetForm()
                },
                { timeout: 3000, maximumAge: 10000 }
            )
        } else {
            sendZoneReport(type, severity, description, null, null)
            resetForm()
        }
    }

    const resetForm = () => {
        setDescription('')
        setUseLocation(false)
        setIsLocating(false)
    }

    const currentSectorZones = activeZones.filter(z => z.sector === roomId)

    const getSeverityColor = (sev) => {
        switch(sev) {
            case 'High': return 'var(--danger)' // red
            case 'Medium': return 'var(--accent-gold)' // yellow/orange
            default: return 'var(--info)' // blue/green
        }
    }

    return (
        <div style={page}>
            <div style={container}>
                <div style={header}>
                    <Map size={32} color="var(--accent-gold)" />
                    <h2 style={title}>Disaster Zones</h2>
                </div>

                {}
                <div style={card}>
                    <h3 style={cardHeader}>Report New Danger</h3>
                    <form onSubmit={handleSubmit} style={form}>
                        <div style={inputGroup}>
                            <label style={label}>Danger Type</label>
                            <select 
                                value={type} 
                                onChange={e => setType(e.target.value)}
                                style={input}
                            >
                                <option>Flooding</option>
                                <option>Fire</option>
                                <option>Structure Collapse</option>
                                <option>Power Outage</option>
                                <option>Road Blocked</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div style={inputGroup}>
                            <label style={label}>Severity</label>
                            <select 
                                value={severity} 
                                onChange={e => setSeverity(e.target.value)}
                                style={input}
                            >
                                <option>High</option>
                                <option>Medium</option>
                                <option>Low</option>
                            </select>
                        </div>
                        <div style={inputGroup}>
                            <label style={label}>Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="E.g. Main street flooded, water rising..."
                                style={input}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', marginBottom: '16px', cursor: 'pointer' }} onClick={() => setUseLocation(!useLocation)}>
                            <div style={{
                                width: '18px', height: '18px', borderRadius: '4px',
                                border: `2px solid ${useLocation ? 'var(--info)' : 'var(--border-subtle)'}`,
                                background: useLocation ? 'var(--info)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {useLocation && <div style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '2px' }} />}
                            </div>
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Attach my current location</span>
                        </div>
                        <button type="submit" style={button} disabled={isLocating}>
                            {isLocating ? 'Locating...' : 'Broadcast Warning'}
                        </button>
                    </form>
                </div>

                {}
                <div style={boardSection}>
                    <h3 style={boardTitle}>Active Threats (Sector {roomId})</h3>
                    {currentSectorZones.length === 0 ? (
                        <p style={emptyText}>No danger zones reported in this sector.</p>
                    ) : (
                        <div style={list}>
                            {currentSectorZones.slice().reverse().map((zone) => (
                                <div key={zone.id} style={{...zoneCard, borderLeftColor: getSeverityColor(zone.severity)}}>
                                    <div style={zoneHeader}>
                                        <span style={{...zoneType, color: getSeverityColor(zone.severity)}}>
                                            <ShieldAlert size={18} />
                                            {zone.type}
                                        </span>
                                        <span style={{
                                            ...badge,
                                            backgroundColor: getSeverityColor(zone.severity)
                                        }}>
                                            {zone.severity.toUpperCase()}
                                        </span>
                                    </div>
                                    <p style={zoneDesc}>{zone.description}</p>
                                    <div style={zoneFooter}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>Reported by: {zone.senderId === 'me' ? 'You' : `Peer ${zone.senderId.slice(0, 6)}`}</span>
                                            {zone.lat && zone.lng && (
                                                <button 
                                                    style={navigateBtn} 
                                                    onClick={() => setNavTarget({ lat: zone.lat, lng: zone.lng })}
                                                >
                                                    <Navigation size={12} /> Map
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>{new Date(zone.timestamp).toLocaleTimeString()}</span>
                                            {zone.senderId === 'me' && (
                                                <button 
                                                    onClick={() => deleteMessage(zone.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                                                    title="Delete Zone"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {navTarget && (
                <MapNavigation 
                    targetLocation={navTarget} 
                    onClose={() => setNavTarget(null)} 
                />
            )}
        </div>
    )
}

const page = {
    minHeight: '100vh',
    background: 'var(--bg-dark)',
    color: 'var(--text-primary)',
    padding: '24px 24px 80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
}

const container = {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
}

const header = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
}

const title = {
    fontSize: '24px',
    margin: 0,
    fontWeight: '500',
    color: 'var(--text-primary)',
}

const card = {
    background: 'var(--bg-card)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid var(--border-subtle)',
}

const cardHeader = {
    margin: '0 0 16px',
    fontSize: '18px',
    fontWeight: '500',
    color: 'var(--text-primary)'
}

const form = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
}

const inputGroup = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
}

const label = {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
}

const input = {
    background: 'var(--bg-dark)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--border-radius-pill)',
    color: 'var(--text-primary)',
    padding: '16px 20px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
}

const button = {
    background: 'transparent',
    color: 'var(--accent-gold)',
    border: '1px solid var(--accent-gold)',
    padding: '16px',
    borderRadius: 'var(--border-radius-pill)',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.2s',
}

const boardSection = {
    marginTop: '12px',
}

const boardTitle = {
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 0 16px',
    borderBottom: '1px solid var(--border-subtle)',
    paddingBottom: '12px',
    color: 'var(--text-secondary)'
}

const emptyText = {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    textAlign: 'center',
    margin: '20px 0',
}

const list = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
}

const zoneCard = {
    background: 'var(--bg-card)',
    borderLeft: '4px solid',
    borderRadius: '16px',
    padding: '16px',
    borderTop: '1px solid var(--border-subtle)',
    borderRight: '1px solid var(--border-subtle)',
    borderBottom: '1px solid var(--border-subtle)',
}

const zoneHeader = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
}

const zoneType = {
    fontWeight: '600',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
}

const badge = {
    color: '#111',
    fontSize: '10px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: 'var(--border-radius-pill)',
}

const zoneDesc = {
    margin: '0 0 12px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    lineHeight: '1.5'
}

const zoneFooter = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: 'var(--text-secondary)',
}

const navigateBtn = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(59, 130, 246, 0.1)',
    color: 'var(--info)',
    border: '1px solid var(--info)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
}