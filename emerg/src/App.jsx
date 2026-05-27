import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './features/auth/useAuth'
import { MeshProvider } from './features/mesh/MeshContext'
import AuthPage from './features/auth/AuthPage'
import DashboardPage from './features/dashboard/DashboardPage'
import SOSPage from './features/sos/SOSPage'
import VolunteersPage from './features/volunteers/VolunteersPage'
import ZonesPage from './features/zones/ZonesPage'
import BottomNav from './components/BottomNav'
import TopNav from './components/TopNav'
import { Loader } from 'lucide-react'

function App() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
      fontFamily: 'system-ui', fontSize: '18px', gap: '8px'
    }}>
      <Loader className="spin" size={24} /> Loading...
    </div>
  )

  if (!user) return <AuthPage />

  return (
    <MeshProvider>
      <BrowserRouter>
        <TopNav />
        <div style={{ paddingTop: '72px' }}> {}
            <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/sos" element={<SOSPage />} />
            <Route path="/volunteers" element={<VolunteersPage />} />
            <Route path="/zones" element={<ZonesPage />} />
            </Routes>
        </div>
        <BottomNav />
      </BrowserRouter>
    </MeshProvider>
  )
}

export default App