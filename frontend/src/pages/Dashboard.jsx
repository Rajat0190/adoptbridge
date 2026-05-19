import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profile)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-700">AdoptBridge 🌉</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome, {profile.full_name}! 👋
          </h2>
          <p className="text-gray-500 mb-6">
            You are logged in as <span className="font-semibold text-indigo-600 capitalize">{profile.role}</span>
          </p>

          {profile.role === 'parent' && (
  <div className="bg-indigo-50 rounded-xl p-6">
    <h3 className="text-lg font-semibold text-indigo-700 mb-2">Parent Dashboard</h3>
    <p className="text-gray-600 mb-4">Browse children profiles and find your perfect match.</p>
    <button
      onClick={() => navigate('/parent-profile')}
      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
    >
      Complete My Profile
    </button>
  </div>
)}

{profile.role === 'ngo' && (
  <div className="bg-green-50 rounded-xl p-6">
    <h3 className="text-lg font-semibold text-green-700 mb-2">NGO Dashboard</h3>
    <p className="text-gray-600 mb-4">Register children and manage their profiles and assessments.</p>
    <div className="flex gap-3 flex-wrap">
      <button
        onClick={() => navigate('/child-profile')}
        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium"
      >
        + Register a Child
      </button>
      <button
        onClick={() => navigate('/assessment')}
        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
      >
        📝 Take Assessment
      </button>
    </div>
  </div>
)}

          {profile.role === 'admin' && (
            <div className="bg-orange-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-orange-700 mb-2">Admin Dashboard</h3>
              <p className="text-gray-600">Manage all users, verify profiles and oversee the platform.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard    