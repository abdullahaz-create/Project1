import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ClassDashboard from './pages/ClassDashboard';

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/class/:classId"
            element={
              <ProtectedRoute>
                <ClassDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/class/9" replace />} />
          <Route path="*" element={<Navigate to="/class/9" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
