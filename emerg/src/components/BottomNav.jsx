import { NavLink } from 'react-router-dom'
import { Home, Siren, Users, Map } from 'lucide-react'

const tabs = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/sos', icon: Siren, label: 'SOS' },
    { to: '/volunteers', icon: Users, label: 'Volunteers' },
    { to: '/zones', icon: Map, label: 'Zones' },
]

export default function BottomNav() {
    return (
        <nav style={styles.navWrapper}>
            <div style={styles.navBar}>
                {tabs.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end
                        style={({ isActive }) => ({
                            ...styles.tab,
                            ...(isActive ? styles.active : {}),
                        })}
                    >
                        {({ isActive }) => (
                            <>
                                <Icon 
                                    size={20} 
                                    color={isActive ? 'var(--text-primary)' : 'var(--text-secondary)'} 
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span style={{
                                    ...styles.label,
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                                }}>
                                    {label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}

const styles = {
    navWrapper: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '0 24px 24px',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 100,
        pointerEvents: 'none', 
    },
    navBar: {
        display: 'flex',
        width: '100%',
        maxWidth: '400px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--border-radius-pill)',
        height: '64px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        pointerEvents: 'auto', 
        overflow: 'hidden',
    },
    tab: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
    },
    active: { 
        background: 'var(--bg-card-hover)', 
    },
    label: { 
        fontWeight: '500', 
        fontSize: '11px',
    },
}