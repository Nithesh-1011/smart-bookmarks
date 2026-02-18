"use client"

import { useEffect } from "react"
import { createClient } from '@supabase/supabase-js'
import { useRouter } from "next/navigation"

export default function Login() {
  const router = useRouter()

  // Dynamic Supabase (build-safe)
  const getSupabase = () => {
    if (typeof window === 'undefined') return null
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) return null
    return createClient(supabaseUrl, supabaseKey)
  }

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/homepage")
    })
  }, [router])

  const googleLogin = async () => {
    const supabase = getSupabase()
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/homepage` }
    })
  }

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'}}>
      <div style={{background: 'white', padding: '48px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxWidth: 400, width: '100%', margin: '16px'}}>
        <div style={{textAlign: 'center', marginBottom: '48px'}}>
          <h1 style={{fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px'}}>Login</h1>
          <p style={{color: '#6b7280'}}>Continue with Google</p>
        </div>
        <button 
          onClick={googleLogin}
          style={{
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px', 
            padding: '16px', 
            border: '2px solid #e5e7eb', 
            background: 'white', 
            borderRadius: '16px', 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#1f2937',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          🌐 Continue with Google
        </button>
      </div>
    </div>
  )
}
