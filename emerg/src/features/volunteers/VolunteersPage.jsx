import { useState } from 'react'
import { useMeshContext } from '../mesh/MeshContext'
import { Users, UserCheck, User } from 'lucide-react'

export default function VolunteersPage() {
    const { discoveredVolunteers, sendVolunteerStatus, myVolunteerStatus, roomId } = useMeshContext()
    const [name, setName] = useState(myVolunteerStatus?.name || '')
    const [skills, setSkills] = useState(myVolunteerStatus?.skills || '')
    const [isActive, setIsActive] = useState(myVolunteerStatus?.active || false)

    const handleToggleVolunteer = (e) => {
        e.preventDefault()
        const newActiveState = !isActive
        setIsActive(newActiveState)
        sendVolunteerStatus(newActiveState, skills, name)
    }

    const activeVolunteersList = Object.entries(discoveredVolunteers)
        .map(([peerId, info]) => ({ peerId, ...info }))
        .filter(vol => vol.active && Date.now() - vol.lastSeen < 45000) // 45s heartbeat window

    return (
        <div style={page}>
            <div style={container}>
                <div style={header}>
                    <Users size={32} color="var(--info)" />
                    <h2 style={title}>Volunteer Hub</h2>
                </div>

                {}
                <div style={card}>
                    <div style={cardHeaderRow}>
                        {isActive && <UserCheck size={20} color="var(--info)" />}
                        <h3 style={cardHeader}>{isActive ? 'You are an Active Volunteer' : 'Register as Volunteer'}</h3>
                    </div>
                    <form onSubmit={handleToggleVolunteer} style={form}>
                        <div style={inputGroup}>
                            <label style={label}>Your Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="E.g. John Doe"
                                style={input}
                                required
                                disabled={isActive}
                            />
                        </div>
                        <div style={inputGroup}>
                            <label style={label}>Specialized Skills / Supplies</label>
                            <input
                                type="text"
                                value={skills}
                                onChange={(e) => setSkills(e.target.value)}
                                placeholder="E.g. First Aid, Search & Rescue, Chainsaw"
                                style={input}
                                required
                                disabled={isActive}
                            />
                        </div>
                        <button
                            type="submit"
                            style={{
                                ...button,
                                border: `1px solid ${isActive ? 'var(--danger)' : 'var(--accent-gold)'}`,
                                color: isActive ? 'var(--danger)' : 'var(--accent-gold)',
                            }}
                        >
                            {isActive ? 'Stop Volunteering' : 'Activate Volunteer Status'}
                        </button>
                    </form>
                </div>

                {}
                <div style={directorySection}>
                    <h3 style={directoryTitle}>Volunteers Nearby (Sector {roomId})</h3>
                    {activeVolunteersList.length === 0 ? (
                        <p style={emptyText}>No other active volunteers detected in this sector yet.</p>
                    ) : (
                        <div style={list}>
                            {activeVolunteersList.map((vol) => (
                                <div key={vol.peerId} style={volCard}>
                                    <div style={volHeader}>
                                        <div style={volName}>
                                            <User size={16} color="var(--info)" />
                                            <span>{vol.name}</span>
                                        </div>
                                        <span style={volSector}>Sector {vol.sector?.slice(-7)}</span>
                                    </div>
                                    <p style={volSkills}><strong>Skills:</strong> {vol.skills}</p>
                                    <span style={peerIdTag}>Peer ID: {vol.peerId.slice(0, 8)}...</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
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

const cardHeaderRow = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
}

const cardHeader = {
    margin: 0,
    fontSize: '18px',
    fontWeight: '500',
    color: 'var(--text-primary)',
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
    padding: '16px',
    borderRadius: 'var(--border-radius-pill)',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.2s',
}

const directorySection = {
    marginTop: '12px',
}

const directoryTitle = {
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

const volCard = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderLeft: '4px solid var(--info)',
    borderRadius: '16px',
    padding: '16px',
}

const volHeader = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
}

const volName = {
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
}

const volSector = {
    fontSize: '11px',
    color: 'var(--info)',
    background: 'rgba(59, 130, 246, 0.1)',
    padding: '4px 10px',
    borderRadius: 'var(--border-radius-pill)',
    fontWeight: '600',
}

const volSkills = {
    margin: '0 0 12px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
}

const peerIdTag = {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontFamily: 'monospace',
    background: 'var(--bg-dark)',
    padding: '4px 8px',
    borderRadius: '6px',
}