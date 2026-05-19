import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ChildProfile from './pages/ChildProfile'
import ParentProfile from './pages/ParentProfile'
import Assessment from './pages/Assessment'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/child-profile" element={<ChildProfile />} />
        <Route path="/parent-profile" element={<ParentProfile />} />
        <Route path="/assessment" element={<Assessment />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App