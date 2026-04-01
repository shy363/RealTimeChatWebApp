import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import InviteHandler from './pages/InviteHandler'
import { AuthProvider, useAuth } from './context/AuthContext'

const AppContent = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/chat" /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/chat" /> : <Register />} 
          />
          <Route 
            path="/chat" 
            element={user ? <Chat /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/invite/:inviteCode" 
            element={<InviteHandler />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/chat" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
