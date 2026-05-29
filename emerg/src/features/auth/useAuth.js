import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export function useAuth() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const ensureProfile = async (u) => {
            if (!u) return
            try {
                const { data, error } = await supabase.from('profiles').select('id').eq('id', u.id).maybeSingle()
                if (error) throw error
                if (!data) {
                    const { error: insertError } = await supabase.from('profiles').insert({
                        id: u.id,
                        username: u.email.split('@')[0],
                        is_volunteer: false
                    })
                    if (insertError && insertError.code !== '23505') { // Ignore duplicate key violation (23505)
                        throw insertError
                    }
                }
            } catch (err) {
                console.warn('Failed to ensure profile:', err.message)
            }
        }
        supabase.auth.getSession().then(({ data: { session } }) => {
            const u = session?.user ?? null
            setUser(u)
            setLoading(false)
            ensureProfile(u)
        })
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                const u = session?.user ?? null
                setUser(u)
                ensureProfile(u)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const signUp = async (email, password, username) => {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        
        // If email confirmation is enabled, the user is unauthenticated until they confirm.
        // In this case, client-side RLS will block inserting into 'profiles'.
        // We only insert if the session is immediately active.
        if (data.session) {
            try {
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: data.user.id,
                    username: username || email.split('@')[0],
                    is_volunteer: false,
                })
                if (profileError && profileError.code !== '23505') {
                    console.warn('Profile insert warning:', profileError.message)
                }
            } catch (err) {
                console.warn('Profile creation failed or already exists:', err.message)
            }
        }

        return data
    }

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
        return data
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    return { user, loading, signUp, signIn, signOut }
}