import React from 'react';
import { useAuth } from '../features/auth/useAuth';

export default function TopNav() {
    const { user, signOut } = useAuth();
    
    if (!user) return null;
    
    return (
        <div style={styles.container}>
            <div style={styles.logoGroup}>
                <div style={styles.iconGrid}>
                    <div style={{ ...styles.box, opacity: 0.5 }}></div>
                    <div style={styles.box}></div>
                    <div style={styles.box}></div>
                    <div style={styles.box}></div>
                </div>
                <h1 style={styles.brand}>EmergMesh</h1>
            </div>
            
            <div style={styles.navLinks}>
                <button onClick={signOut} style={styles.signOut}>Sign out</button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        background: 'var(--bg-dark)',
        zIndex: 100,
        borderBottom: '1px solid var(--border-subtle)',
    },
    logoGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    iconGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
        width: '24px',
        height: '24px',
    },
    box: {
        background: 'var(--text-primary)',
        borderRadius: '2px',
        width: '100%',
        height: '100%',
    },
    brand: {
        fontSize: '20px',
        fontWeight: '600',
        color: 'var(--text-primary)',
        margin: 0,
        letterSpacing: '-0.5px',
    },
    navLinks: {
        display: 'flex',
        alignItems: 'center',
    },
    signOut: {
        background: 'transparent', 
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)', 
        padding: '8px 16px', 
        borderRadius: 'var(--border-radius-pill)',
        cursor: 'pointer', 
        fontSize: '13px', 
        fontWeight: '500', 
        transition: 'all 0.2s',
    }
};
