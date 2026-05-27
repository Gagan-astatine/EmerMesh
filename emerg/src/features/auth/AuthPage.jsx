import { useState } from 'react'
import { useAuth } from './useAuth'
import { ArrowRight } from 'lucide-react'

export default function AuthPage() {
    const { signIn, signUp } = useAuth()
    const [mode, setMode] = useState('login') // 'login' | 'signup'
    const [form, setForm] = useState({ email: '', password: '', username: '' })
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const submit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            if (mode === 'login') {
                await signIn(form.email, form.password)
            } else {
                if (!form.username.trim()) throw new Error('Username is required')
                await signUp(form.email, form.password, form.username)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {}
                <div style={styles.header}>
                    <h1 style={styles.title}>Welcome back</h1>
                    <p style={styles.subtitle}>Enter your details below</p>
                </div>

                {}
                <div style={styles.toggle}>
                    <button
                        style={{ ...styles.toggleBtn, ...(mode === 'login' ? styles.activeBtn : {}) }}
                        onClick={() => setMode('login')}
                    >
                        Login
                    </button>
                    <button
                        style={{ ...styles.toggleBtn, ...(mode === 'signup' ? styles.activeBtn : {}) }}
                        onClick={() => setMode('signup')}
                    >
                        Sign Up
                    </button>
                </div>

                {}
                <form onSubmit={submit} style={styles.form}>
                    {mode === 'signup' && (
                        <input
                            style={styles.input}
                            name="username"
                            placeholder="Username"
                            value={form.username}
                            onChange={handle}
                            required
                        />
                    )}
                    <input
                        style={styles.input}
                        name="email"
                        type="email"
                        placeholder="Email address"
                        value={form.email}
                        onChange={handle}
                        required
                    />
                    <input
                        style={styles.input}
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handle}
                        required
                    />

                    {error && <p style={styles.error}>{error}</p>}

                    <button style={styles.submitBtn} type="submit" disabled={loading}>
                        {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
                        {!loading && <ArrowRight size={16} />}
                    </button>
                </form>

                <div style={styles.footer}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                        {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                    </span>
                    <button 
                        style={styles.linkBtn}
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    >
                        {mode === 'login' ? 'Sign up' : 'Login'}
                    </button>
                </div>
            </div>
        </div>
    )
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'var(--bg-dark)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
    },
    card: {
        background: 'var(--bg-card)',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    },
    header: { textAlign: 'center', marginBottom: '32px' },
    title: { color: 'var(--text-primary)', fontSize: '28px', margin: '0 0 8px', fontWeight: '500' },
    subtitle: { color: 'var(--text-secondary)', fontSize: '15px', margin: 0 },
    toggle: {
        display: 'flex',
        background: 'var(--bg-dark)',
        borderRadius: 'var(--border-radius-pill)',
        padding: '4px',
        marginBottom: '24px',
        border: '1px solid var(--border-subtle)',
    },
    toggleBtn: {
        flex: 1,
        padding: '12px',
        border: 'none',
        borderRadius: 'var(--border-radius-pill)',
        background: 'transparent',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s',
    },
    activeBtn: { 
        background: 'var(--bg-card)', 
        color: 'var(--text-primary)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    input: {
        padding: '16px 20px',
        borderRadius: 'var(--border-radius-pill)',
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-dark)',
        color: 'var(--text-primary)',
        fontSize: '15px',
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    error: {
        color: 'var(--danger)',
        fontSize: '13px',
        margin: 0,
        padding: '12px',
        background: 'var(--danger-glow)',
        borderRadius: '8px',
        border: '1px solid var(--danger)',
    },
    submitBtn: {
        padding: '16px',
        borderRadius: 'var(--border-radius-pill)',
        border: '1px solid var(--accent-gold)',
        background: 'transparent',
        color: 'var(--accent-gold)',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '8px',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
    footer: {
        marginTop: '24px',
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '14px',
    },
    linkBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--text-primary)',
        fontWeight: '600',
        cursor: 'pointer',
        padding: 0,
        fontSize: '14px',
    }
}