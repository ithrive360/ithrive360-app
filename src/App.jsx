import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import logo from './assets/logo.png'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const initUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data, error } = await supabase
          .from('user_profile')
          .insert([
            {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email.split('@')[0],
              dna_uploaded: false,
              blood_uploaded: false,
            }
          ])
          .select()

        if (error) {
          if (error.code === '23505') {
            console.log('User already exists in user_profile table')
          } else {
            console.error('Error inserting user into profile table:', error.message)
          }
        } else {
          console.log('✅ Inserted user_profile:', data)
        }
      }
    }

    initUserProfile()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Logout error:', error.message)
    else setUser(null)
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (error) alert(error.message)
  }

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    setLoading(false)
  }

  const handleSignup = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    setLoading(false)
  }

  if (!user) {
    return (
      <div style={{
        backgroundColor: '#fff',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '10px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <img src={logo} alt="iThrive360 Logo" style={{ width: '180px', marginBottom: '2rem' }} />

          <button
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              backgroundColor: '#6366f1',
              color: '#fff',
              padding: '0.75rem',
              border: 'none',
              borderRadius: '5px',
              fontSize: '1rem',
              fontWeight: 500,
              marginBottom: '2rem',
              cursor: 'pointer'
            }}
          >
            Sign in with Google
          </button>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              marginBottom: '1rem',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f5f5f5',
              color: '#000',
              fontSize: '1rem'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              marginBottom: '1.5rem',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f5f5f5',
              color: '#000',
              fontSize: '1rem'
            }}
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#6366f1',
              color: '#fff',
              padding: '0.75rem',
              border: 'none',
              borderRadius: '5px',
              fontSize: '1rem',
              fontWeight: 500,
              marginBottom: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Log In
          </button>

          <button
            onClick={handleSignup}
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#6366f1',
              color: '#fff',
              padding: '0.75rem',
              border: 'none',
              borderRadius: '5px',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
      color: '#000'
    }}>
      <img src={logo} alt="iThrive360 logo" style={{ width: '180px', marginBottom: '2rem' }} />
      <h1>iThrive360</h1>

      <p>
        Welcome, {user.user_metadata?.name?.split(' ')[0] || user.email || 'there'}!
      </p>
      <h1>SCREW YOU BOLTON !!!</h1>

      <button
        onClick={handleLogout}
        style={{
          backgroundColor: '#6366f1',
          color: '#fff',
          padding: '0.75rem 1.5rem',
          border: 'none',
          borderRadius: '5px',
          fontSize: '1rem',
          fontWeight: 500,
          cursor: 'pointer',
          marginBottom: '1rem'
        }}
      >
        Sign out
      </button>
    </div>
  )
}

export default App
