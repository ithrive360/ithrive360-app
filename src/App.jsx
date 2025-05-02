import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { supabase } from './supabaseClient'

import Auth from './Auth'

function App() {
  const [user, setUser] = useState(null)
  console.log('✅ LOG CHECK — App started! User is:', user)

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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) console.error('Google login error:', error.message)
  }

  if (!user) {
    return (
      <>
        <button onClick={handleGoogleLogin}>Sign in with Google</button>
        <Auth />
      </>
    )
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h1>iThrive360</h1>

      <p>
        Welcome, {user.user_metadata?.name?.split(' ')[0] || user.email || 'there'}!
        <h1>SCREW YOU BOLTON !!!</h1>
      </p>
      

      <button onClick={handleLogout}>Sign out</button>

      <div className="card">
        <button onClick={() => alert('💥 You clicked me')}>
          Dev button
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
