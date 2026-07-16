import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import GuardDashboard from './pages/GuardDashboard';
import MallOwnerDashboard from './pages/MallOwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { roleHome } from './roleHome';

function Shell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-concrete">
      <Navbar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 md:py-10">{children}</main>
    </div>
  );
}

function Home() {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHome(user.role)} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route
            path="/park"
            element={
              <ProtectedRoute roles={['user']}>
                <Shell>
                  <UserDashboard />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gate"
            element={
              <ProtectedRoute roles={['guard', 'admin']}>
                <Shell>
                  <GuardDashboard />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner"
            element={
              <ProtectedRoute roles={['mallOwner']}>
                <Shell>
                  <MallOwnerDashboard />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <Shell>
                  <AdminDashboard />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
