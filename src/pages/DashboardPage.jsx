import { supabase } from '../supabaseClient'
import logo from '../assets/logo.png'
import '../App.css'

function DashboardPage({ user }) {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error.message)
    }
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

export default DashboardPage
