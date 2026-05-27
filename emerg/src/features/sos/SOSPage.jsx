import { useState } from 'react'
import { Siren, Navigation, Trash2 } from 'lucide-react'
import { useMeshContext } from '../mesh/MeshContext'
import MapNavigation from '../../components/MapNavigation'

export default function SOSPage() {
    const { sendSOS, messages, roomId, deleteMessage } = useMeshContext()
    const [sending, setSending] = useState(false)
    const [status, setStatus] = useState('')
    const [navTarget, setNavTarget] = useState(null)
    const [customText, setCustomText] = useState('')

    const quickMessages = [
        'Medical Emergency!',
        'Fire / Explosion!',
        'Trapped in Debris!',
        'Need Evacuation!'
    ]

    const handleSOS = async (content) => {
        setSending(true)
        setStatus('')
        try {
            await sendSOS(content)
            setStatus('SOS broadcasted successfully over mesh!')
        } catch (error) {
            setStatus(`Failed to send: ${error.message}`)
        } finally {
            setSending(false)
            setTimeout(() => setStatus(''), 5000)
        }
    }

    const activeSos = messages.filter(msg => msg.priority === 'sos')

    return (
        <div style={page}>
            <div style={container}>
                {}
                <div style={header}>
                    <Siren size={32} color="var(--danger)" style={{ filter: 'drop-shadow(0 0 12px var(--danger-glow))' }} />
                    <h2 style={title}>Emergency Beacon</h2>
                </div>

                {}
                <div style={mainCard}>
                    <button 
                        style={sosBtn} 
                        onClick={() => handleSOS(customText.trim() || 'Emergency Assistance Required!')}
                        disabled={sending}
                    >
                        <Siren size={48} color="#fff" />
                        <span>{sending ? 'SENDING...' : 'BROADCAST SOS'}</span>
                    </button>
                    
                    <textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Optional: Type custom emergency details..."
                        style={input}
                        rows={2}
                    />

                    <p style={sub}>Tap to alert all nearby peers immediately.</p>

                    {status && (
                        <div style={{
                            ...statusMsg,
                            color: status.includes('successfully') ? '#22c55e' : 'var(--danger)',
                            borderColor: status.includes('successfully') ? '#22c55e' : 'var(--danger)',
                        }}>
                            {status}
                        </div>
                    )}
                </div>

                {}
                <div style={quickActions}>
                    {quickMessages.map((msg, i) => (
                        <button key={i} style={quickBtn} onClick={() => handleSOS(msg)}>
                            {msg}
                        </button>
                    ))}
                </div>

                <div style={alertsSection}>
                    <h3 style={alertsTitle}>Active Alerts (Sector {roomId})</h3>
                    {activeSos.length === 0 ? (
                        <p style={emptyText}>No active emergencies in your sector.</p>
                    ) : (
                        <div style={list}>
                            {activeSos.slice().reverse().map((sos, i) => {
                                let contentText = sos.content;
                                let coords = null;
                                try {
                                    const parsed = JSON.parse(sos.content);
                                    if (parsed.text) {
                                        contentText = parsed.text;
                                        if (parsed.lat && parsed.lng) {
                                            coords = { lat: parsed.lat, lng: parsed.lng };
                                        }
                                    }
                                } catch (e) {}

                                return (
                                    <div key={sos.id || i} style={alertCard}>
                                        <div style={alertHeader}>
                                            <span style={alertBadge}>URGENT</span>
                                            <span style={time}>{sos.timestamp ? new Date(sos.timestamp).toLocaleTimeString() : ''}</span>
                                        </div>
                                        <p style={alertText}>{contentText}</p>
                                        <div style={alertFooter}>
                                            <span style={peerId}>From: {sos.fromId === 'me' || sos.senderId === 'me' ? 'You' : `Peer ${sos.senderId?.slice(0, 6) || sos.fromId?.slice(0, 6)}`}</span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {coords && (
                                                    <button 
                                                        style={navigateBtn} 
                                                        onClick={() => setNavTarget(coords)}
                                                    >
                                                        <Navigation size={14} /> Navigate
                                                    </button>
                                                )}
                                                {(sos.fromId === 'me' || sos.senderId === 'me') && (
                                                    <button 
                                                        onClick={() => deleteMessage(sos.id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center' }}
                                                        title="Delete SOS"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
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
    color: 'var(--danger)',
}

const mainCard = {
    background: 'var(--bg-card)',
    borderRadius: '16px',
    padding: '32px 24px',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
}

const sosBtn = {
    background: 'var(--danger)',
    color: '#fff',
    border: 'none',
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 0 32px var(--danger-glow)',
    transition: 'transform 0.1s',
}

const sub = {
    margin: 0,
    color: 'var(--text-secondary)',
    fontSize: '14px',
    textAlign: 'center',
}

const quickActions = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
}

const quickBtn = {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-subtle)',
    padding: '16px',
    borderRadius: 'var(--border-radius-pill)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
}

const alertsSection = {
    marginTop: '12px',
}

const alertsTitle = {
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 0 16px',
    borderBottom: '1px solid var(--border-subtle)',
    paddingBottom: '12px',
    color: 'var(--text-secondary)',
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

const alertCard = {
    background: 'var(--bg-card)',
    borderLeft: '4px solid var(--danger)',
    borderRadius: '16px',
    padding: '16px',
    borderTop: '1px solid var(--border-subtle)',
    borderRight: '1px solid var(--border-subtle)',
    borderBottom: '1px solid var(--border-subtle)',
}

const alertHeader = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
}

const alertBadge = {
    background: 'var(--danger)',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: 'var(--border-radius-pill)',
}

const time = {
    fontSize: '11px',
    color: 'var(--text-secondary)',
}

const alertText = {
    margin: '0 0 12px',
    fontSize: '16px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    lineHeight: '1.4',
}

const alertFooter = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
}

const peerId = {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontFamily: 'monospace',
}

const navigateBtn = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(59, 130, 246, 0.1)',
    color: 'var(--info)',
    border: '1px solid var(--info)',
    padding: '6px 12px',
    borderRadius: 'var(--border-radius-pill)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
}


const input = {
    background: 'var(--bg-dark)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '16px',
    color: 'var(--text-primary)',
    padding: '16px',
    fontSize: '15px',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s',
}


const statusMsg = {
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid',
    background: 'var(--bg-dark)',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
}