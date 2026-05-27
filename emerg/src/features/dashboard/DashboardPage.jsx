import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { useMeshContext } from '../mesh/MeshContext'
import { Siren, Users, Map, Radio, ShieldAlert, UserCheck, Navigation, Trash2 } from 'lucide-react'
import MapNavigation from '../../components/MapNavigation'

export default function DashboardPage() {
    const { user } = useAuth()
    const { meshReady, connectedPeers, messages, roomId, discoveredVolunteers, myVolunteerStatus, deleteMessage } = useMeshContext()
    const [navTarget, setNavTarget] = useState(null)

    const activeSosCount = messages.filter(m => m.priority === 'sos').length
    const activeZonesCount = messages.filter(m => m.priority === 'zone-report').length
    const activeVolunteersCount = Object.values(discoveredVolunteers).filter(v => v.active).length + (myVolunteerStatus?.active ? 1 : 0)

    return (
        <div style={styles.page}>
            {}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Dashboard</h2>
                    <p style={styles.sub}>
                        {meshReady ? 'Network active and syncing.' : 'Connecting to network...'}
                    </p>
                </div>
            </div>

            {}
            <div style={styles.card}>
                <div style={{
                    ...styles.statusDot,
                    background: meshReady ? '#22c55e' : 'var(--accent-gold)',
                }} />
                <div>
                    <p style={styles.cardTitle}>
                        {connectedPeers.length === 0
                            ? 'No peers nearby'
                            : `${connectedPeers.length} active peer${connectedPeers.length > 1 ? 's' : ''}`}
                    </p>
                    <p style={styles.cardSub}>Sector: {roomId ?? '...'}</p>
                </div>
            </div>

            {}
            <div style={styles.grid}>
                {[
                    { icon: Siren, label: 'Send SOS', color: 'var(--danger)', count: activeSosCount },
                    { icon: Users, label: 'Volunteers', color: 'var(--info)', count: activeVolunteersCount },
                    { icon: Map, label: 'Zones', color: 'var(--accent-gold)', count: activeZonesCount },
                    { icon: Radio, label: `${connectedPeers.length} Peers`, color: '#10b981', count: 0 },
                ].map(({ icon: Icon, label, color, count }) => (
                    <div key={label} style={styles.actionCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Icon size={24} color={color} />
                            {count > 0 && (
                                <span style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    color: color,
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    padding: '2px 6px',
                                    borderRadius: '10px'
                                }}>
                                    {count}
                                </span>
                            )}
                        </div>
                        <span style={styles.actionLabel}>{label}</span>
                    </div>
                ))}
            </div>

            {}
            {messages.length > 0 && (
                <>
                    <p style={styles.sectionLabel}>Recent Activity</p>
                    <div style={styles.messageList}>
                        {messages.filter(m => m.priority !== 'delete-message').slice(-5).reverse().map((msg) => (
                            <div key={msg.id} style={{
                                ...styles.messageItem,
                                borderLeftColor: msg.priority === 'sos' ? 'var(--danger)'
                                    : msg.priority === 'urgent' ? 'var(--accent-gold)' : 'var(--border-subtle)',
                            }}>
                                <div style={styles.msgRow}>
                                    <span style={styles.msgFrom}>
                                        {msg.fromId === 'me' ? 'You' : `Peer ${msg.fromId?.slice(0, 6)}`}
                                    </span>
                                    {msg.priority !== 'normal' && (
                                        <span style={{
                                            ...styles.badge,
                                            background: msg.priority === 'sos' ? 'var(--danger-glow)' : 'var(--accent-glow)',
                                            color: msg.priority === 'sos' ? 'var(--danger)' : 'var(--accent-gold)',
                                        }}>
                                            {msg.priority.toUpperCase()}
                                        </span>
                                    )}
                                    {msg.fromId === 'me' && (
                                        <button 
                                            onClick={() => deleteMessage(msg.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', color: 'var(--text-secondary)' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <div style={styles.msgContent}>
                                    {(() => {
                                        if (msg.priority === 'sos') {
                                            try {
                                                const data = JSON.parse(msg.content)
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <span>{data.text || msg.content}</span>
                                                        {data.lat && data.lng && (
                                                            <button 
                                                                style={styles.navigateBtn} 
                                                                onClick={() => setNavTarget({ lat: data.lat, lng: data.lng })}
                                                            >
                                                                <Navigation size={14} /> Navigate to Target
                                                            </button>
                                                        )}
                                                    </div>
                                                )
                                            } catch (e) { return msg.content }
                                        }
                                        if (msg.priority === 'zone-report') {
                                            try {
                                                const data = JSON.parse(msg.content)
                                                return (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <ShieldAlert size={16} color="var(--accent-gold)" />
                                                        <span>{data.type} ({data.severity}): {data.description}</span>
                                                    </div>
                                                )
                                            } catch (e) { return msg.content }
                                        }
                                        if (msg.priority === 'volunteer-status') {
                                            try {
                                                const data = JSON.parse(msg.content)
                                                return (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <UserCheck size={16} color="var(--info)" />
                                                        <span>{data.active ? 'Active Volunteer' : 'Inactive'} - {data.name} (Skills: {data.skills})</span>
                                                    </div>
                                                )
                                            } catch (e) { return msg.content }
                                        }
                                        return msg.content
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <p style={styles.userInfo}>Logged in as {user?.email}</p>

            {navTarget && (
                <MapNavigation 
                    targetLocation={navTarget} 
                    onClose={() => setNavTarget(null)} 
                />
            )}
        </div>
    )
}

const styles = {
    page: {
        minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)',
        padding: '24px 24px 80px',
        maxWidth: '700px',
        margin: '0 auto',
    },
    header: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '32px',
    },
    title: { fontSize: '24px', margin: '0 0 4px', fontWeight: '500' },
    sub: { fontSize: '14px', margin: 0, color: 'var(--text-secondary)' },
    signOut: {
        background: 'transparent', border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 'var(--border-radius-pill)',
        cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s',
    },
    card: {
        background: 'var(--bg-card)', borderRadius: 'var(--border-radius-card)', padding: '20px',
        display: 'flex', alignItems: 'center', gap: '16px',
        marginBottom: '24px', border: '1px solid var(--border-subtle)',
    },
    statusDot: {
        width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
    },
    cardTitle: { margin: '0 0 4px', fontWeight: '500', fontSize: '16px' },
    cardSub: { margin: 0, color: 'var(--text-secondary)', fontSize: '13px' },
    sectionLabel: {
        color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500',
        marginBottom: '16px',
    },
    grid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px', marginBottom: '32px',
    },
    actionCard: {
        background: 'var(--bg-card)', borderRadius: '12px', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '12px',
        border: '1px solid var(--border-subtle)', cursor: 'pointer',
        transition: 'background 0.2s',
    },
    actionLabel: { fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' },
    messageList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' },
    messageItem: {
        background: 'var(--bg-card)', borderRadius: '12px', padding: '16px',
        borderLeft: '4px solid',
        borderTop: '1px solid var(--border-subtle)',
        borderRight: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
    },
    msgRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
    msgFrom: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' },
    badge: {
        fontSize: '11px', fontWeight: '600', padding: '4px 8px',
        borderRadius: 'var(--border-radius-pill)',
    },
    msgContent: { margin: 0, fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.5' },
    userInfo: { color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginTop: '32px' },
    navigateBtn: {
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
        marginTop: '8px',
        width: 'fit-content',
    }
}