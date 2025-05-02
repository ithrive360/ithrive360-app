import { useState } from 'react'
import { supabase } from './supabaseClient'

function Auth() {
  const [mode, setMode] = useState('login') // or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (!email || !password || (mode === 'signup' && !name)) {
      setMessage('Please fill in all required fields.')
      return
    }

    if (mode === 'signup') {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      })

      if (signUpError) {
        setMessage(signUpError.message)
        return
      }

      const user = signUpData?.user
      if (user) {
        await supabase.from('user_profile').insert({
          id: user.id,
          email,
          full_name: name,
          dna_uploaded: false,
          blood_uploaded: false
        })
      }

      setMessage('Signup successful! Please check your email to confirm your account.')
      resetForm()
    }

    if (mode === 'login') {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (loginError) {
        setMessage(loginError.message)
        return
      }

      const user = loginData?.user
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profile')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!profile && !profileError) {
          await supabase.from('user_profile').insert({
            id: user.id,
            email,
            full_name: user.user_metadata?.full_name || '',
            dna_uploaded: false,
            blood_uploaded: false
          })
        }
      }

      setMessage('Login successful!')
      resetForm()
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2>{mode === 'signup' ? 'Create Account' : 'Log In'}</h2>
      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', marginBottom: '0.5rem' }}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '1rem' }}
        />
        <button type="submit" style={{ width: '100%' }}>
          {mode === 'signup' ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      <p style={{ marginTop: '1rem' }}>
        {mode === 'signup'
          ? 'Already have an account?'
          : 'Need to create an account?'}{' '}
        <button onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
          {mode === 'signup' ? 'Log In' : 'Sign Up'}
        </button>
      </p>

      {message && (
        <p style={{ color: 'red', marginTop: '1rem' }}>{message}</p>
      )}
    </div>
  )
}

export default Auth
