import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Login from './pages/Login';
import TaskBoard from './pages/TaskBoard';
import AssignTask from './pages/AssignTask';
import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';

export default function App() {
  const { user } = useAuth();
  const home = user
    ? user.role === 'supervisor'
      ? '/board'
      : '/my-tasks'
    : '/login';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/board"
        element={
          <ProtectedRoute role="supervisor">
            <TaskBoard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assign"
        element={
          <ProtectedRoute role="supervisor">
            <AssignTask />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="supervisor">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-tasks"
        element={
          <ProtectedRoute role="staff">
            <MyTasks />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}