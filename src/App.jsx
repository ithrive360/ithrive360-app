import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import logo from './assets/logo.png'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [view, setView] = useState('login') // login or signup
  const [message, setMessage] = useState('')
  const [isPasswordValid, setIsPasswordValid] = useState(true)

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

  const validatePassword = (pwd) => {
    return (
      pwd.length >= 8 &&
      /[a-z]/.test(pwd) &&
      /[A-Z]/.test(pwd) &&
      /\d/.test(pwd) &&
      /[^A-Za-z0-9]/.test(pwd)
    )
  }

  const handleSignup = async () => {
    setLoading(true)
    setMessage('')

    if (password !== confirmPassword) {
      setMessage("❌ Passwords don't match")
      setLoading(false)
      return
    }

    if (!validatePassword(password)) {
      setMessage('❌ Password must be 8+ chars with uppercase, lowercase, number, and symbol.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    if (error) {
      alert(error.message)
    } else {
      setMessage('✅ Account created. Please check your email to verify before logging in.')
      setView('login')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setFullName('')
    }

    setLoading(false)
  }

  const handlePasswordChange = (pwd) => {
    setPassword(pwd)
    setIsPasswordValid(validatePassword(pwd))
  }

  if (!user) {
    return (
      <div className="app-container">
        <div className="auth-box">
          <img src={logo} alt="iThrive360 Logo" className="logo" />

          <button onClick={handleGoogleLogin} className="btn btn-primary">
            Sign in with Google
          </button>

          {view === 'signup' && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
              />
            </>
          )}

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
            onChange={(e) => handlePasswordChange(e.target.value)}
            className="input"
          />

          {view === 'signup' && (
            <>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
              />
              {!isPasswordValid && (
                <p style={{ color: 'red', fontSize: '0.9rem' }}>
                  Password must be 8+ characters with a capital, lowercase, number, and special character.
                </p>
              )}
            </>
          )}

          {view === 'login' ? (
            <>
              <button onClick={handleLogin} disabled={loading} className="btn btn-primary">
                Log In
              </button>
              <button onClick={() => setView('signup')} className="btn btn-primary">
                Sign Up
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSignup} disabled={loading} className="btn btn-primary">
                Sign Up
              </button>
              <button onClick={() => setView('login')} className="btn btn-primary">
                Log In
              </button>
            </>
          )}

          {message && (
            <p style={{ marginTop: '1rem', fontSize: '0.95rem', color: message.startsWith('✅') ? 'green' : 'red' }}>
              {message}
            </p>
          )}
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
