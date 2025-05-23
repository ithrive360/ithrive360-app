import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { supabase } from '../supabaseClient';
import logo from '../assets/logo.png';

function AuthPage() {
  const [mode, setMode] = useState('login'); // or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleGoogleLogin = async () => {
    const isLocalhost = window.location.hostname === 'localhost';
    const redirectTo = window.location.origin + '/auth/callback';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo
      }
    });

    if (error) setMessage(error.message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!email || !password || (mode === 'signup' && !name)) {
      setMessage('Please fill in all required fields.');
      return;
    }

    if (mode === 'signup') {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });

      if (signUpError) {
        setMessage(signUpError.message);
        return;
      }

      const user = signUpData?.user;
      if (user) {
        await supabase.from('user_profile').insert({
          id: user.id,
          email,
          full_name: name,
          dna_uploaded: false,
          blood_uploaded: false
        });
      }

      setMessage('Signup successful! Please check your email to confirm your account.');
      resetForm();
      setMode('login');
      return;
    }

    if (mode === 'login') {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

      if (loginError) {
        setMessage(loginError.message);
        return;
      }

      const user = loginData?.user;
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profile')
          .select('user_id')
          .eq('user_id', user.id)
          .single();

        if (!profile && !profileError) {
          await supabase.from('user_profile').insert({
            id: user.id,
            email,
            full_name: user.user_metadata?.full_name || '',
            dna_uploaded: false,
            blood_uploaded: false
          });
        }

        navigate('/dashboard');
      }

      resetForm();
    }
  };

  return (
    <div className="app-container">
      <div className="auth-box">
        <img src={logo} alt="iThrive360 Logo" className="logo" />

        <button onClick={handleGoogleLogin} className="btn btn-primary">
          Sign in with Google
        </button>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
          />

          <button type="submit" className="btn btn-primary">
            {mode === 'signup' ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <button onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')} className="btn btn-primary">
          {mode === 'signup' ? 'Log In' : 'Sign Up'}
        </button>

        {message && (
          <p style={{ color: message.startsWith('Signup successful') ? 'green' : 'red', marginTop: '1rem' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default AuthPage;
