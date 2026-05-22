import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

function AdminPanel() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [children, setChildren] = useState([])
  const [parents, setParents] = useState([])
  const [users, setUsers] = useState([])
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const { data: childData } = await supabase
      .from('children')
      .select('*')
    setChildren(childData || [])

    const { data: parentData } = await supabase
      .from('parents')
      .select('*')
    setParents(parentData || [])

    const { data: userData } = await supabase
      .from('profiles')
      .select('*')
    setUsers(userData || [])

    const { data: assessmentData } = await supabase
      .from('assessments')
      .select('*')
    setAssessments(assessmentData || [])

    setLoading(false)
  }

  const deleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await supabase.from('profiles').delete().eq('id', id)
      fetchData()
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading admin panel...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-orange-600">⚙️ Admin Panel</h1>
              <p className="text-gray-500 text-sm mt-1">AdoptBridge Platform Management</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {['overview', 'children', 'parents', 'users'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition capitalize ${activeTab === tab ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {tab === 'overview' ? '📊 Overview' :
                 tab === 'children' ? '👦 Children' :
                 tab === 'parents' ? '👨‍👩‍👧 Parents' : '👥 Users'}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow p-5 text-center">
                <p className="text-4xl font-bold text-indigo-600">{children.length}</p>
                <p className="text-gray-500 text-sm mt-1">Children</p>
              </div>
              <div className="bg-white rounded-2xl shadow p-5 text-center">
                <p className="text-4xl font-bold text-green-600">{parents.length}</p>
                <p className="text-gray-500 text-sm mt-1">Parents</p>
              </div>
              <div className="bg-white rounded-2xl shadow p-5 text-center">
                <p className="text-4xl font-bold text-orange-600">{users.length}</p>
                <p className="text-gray-500 text-sm mt-1">Total Users</p>
              </div>
              <div className="bg-white rounded-2xl shadow p-5 text-center">
                <p className="text-4xl font-bold text-purple-600">{assessments.length}</p>
                <p className="text-gray-500 text-sm mt-1">Assessments</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="font-bold text-gray-700 mb-4">📈 Platform Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                  <span className="text-gray-700">Total assessments taken</span>
                  <span className="font-bold text-indigo-600">{assessments.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Children with disabilities</span>
                  <span className="font-bold text-green-600">{children.filter(c => c.disability).length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-gray-700">CARA eligible parents</span>
                  <span className="font-bold text-orange-600">{parents.filter(p => p.cara_eligible).length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-gray-700">Average assessments per child</span>
                  <span className="font-bold text-purple-600">
                    {children.length > 0 ? (assessments.length / children.length).toFixed(1) : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Children Tab */}
        {activeTab === 'children' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="font-bold text-gray-700 mb-4">👦 Registered Children ({children.length})</h2>
            {children.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No children registered yet.</p>
            ) : (
              <div className="space-y-3">
                {children.map(child => (
                  <div key={child.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">
                        {child.gender === 'female' ? '👧' : '👦'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{child.name}</p>
                        <p className="text-sm text-gray-500">{child.age} years • {child.age_group} {child.disability ? '• 💛 Special Needs' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Parents Tab */}
        {activeTab === 'parents' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="font-bold text-gray-700 mb-4">👨‍👩‍👧 Registered Parents ({parents.length})</h2>
            {parents.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No parents registered yet.</p>
            ) : (
              <div className="space-y-3">
                {parents.map(parent => (
                  <div key={parent.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-800">{parent.full_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{parent.marital_status} • {parent.occupation} • {parent.income_range}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${parent.cara_eligible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {parent.cara_eligible ? '✅ CARA Eligible' : '❌ Not Eligible'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="font-bold text-gray-700 mb-4">👥 All Users ({users.length})</h2>
            {users.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No users yet.</p>
            ) : (
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-800">{user.full_name || 'No name'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold capitalize ${user.role === 'admin' ? 'bg-orange-100 text-orange-700' : user.role === 'parent' ? 'bg-indigo-100 text-indigo-700' : user.role === 'ngo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {user.role}
                      </span>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default AdminPanel