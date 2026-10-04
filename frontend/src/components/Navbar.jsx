import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Brand from './Brand';
import Avatar from './Avatar';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <aside className="rail">
      <Brand />
      <nav>
        {user.role === 'supervisor' ? (
          <>
            <NavLink to="/board">Task board</NavLink>
            <NavLink to="/assign">Assign task</NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
          </>
        ) : (
          <NavLink to="/my-tasks">My tasks</NavLink>
        )}
      </nav>
      <div className="rail-user">
        <div className="who">
          <Avatar name={user.name} />
          <div>
            <div className="name">{user.name}</div>
            <div className="role">
              {user.role === 'supervisor' ? 'Supervisor' : 'Staff'}
            </div>
          </div>
        </div>
        <button className="ghost" onClick={logout}>
          Log out
        </button>
      </div>
    </aside>
  );
}