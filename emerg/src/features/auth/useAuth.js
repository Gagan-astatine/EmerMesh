import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export function useAuth() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const ensureProfile = async (u) => {
            if (!u) return
            try {
                const { data } = await supabase.from('profiles').select('id').eq('id', u.id).single()
                if (!data) {
                    await supabase.from('profiles').insert({
                        id: u.id,
                        username: u.email.split('@')[0],
                        is_volunteer: false
                    })
                }
            } catch (err) {
                await supabase.from('profiles').insert({
                    id: u.id,
                    username: u.email.split('@')[0],
                    is_volunteer: false
                })
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
        await supabase.from('profiles').insert({
            id: data.user.id,
            username,
            is_volunteer: false,
        })

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