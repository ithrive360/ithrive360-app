import logo from '../assets/logo.png';

function DashboardPage({ user }) {
  return (
    <div className="dashboard">
      <img src={logo} alt="iThrive360 Logo" className="logo" />
      <h1>iThrive360</h1>
      <p>
        Welcome, {user.user_metadata?.name?.split(' ')[0] || user.email || 'there'}!
      </p>
      <h1>SCREW YOU BOLTON !!!</h1>
    </div>
  );
}

export default DashboardPage;