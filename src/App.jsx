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
          .insert([{
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0],
            dna_uploaded: false,
            blood_uploaded: false,
          }])
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
      <div className="app-container">
        <div className="auth-box">
          <img src={logo} alt="iThrive360 Logo" className="logo" />

          <button onClick={handleGoogleLogin} className="btn btn-primary">
            Sign in with Google
          </button>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />

          <button onClick={handleLogin} disabled={loading} className="btn btn-primary">
            Log In
          </button>

          <button onClick={handleSignup} disabled={loading} className="btn btn-primary">
            Sign Up
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <img src={logo} alt="iThrive360 Logo" className="logo" />
      <h1>iThrive360</h1>
      <p>
        Welcome, {user.user_metadata?.name?.split(' ')[0] || user.email || 'there'}!
      </p>
      <h1>SCREW YOU BOLTON !!!</h1>
      <button onClick={handleLogout} className="btn btn-primary">
        Sign out
      </button>
    </div>
  )
}

export default App
