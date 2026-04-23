import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <div className="navbar">
      <Link to="/projects" className="brand">
        Progress-Hub
      </Link>
      <div className="user">
        {user && <span>{user.name}</span>}
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
