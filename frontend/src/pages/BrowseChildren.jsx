import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

function BrowseChildren() {
  const navigate = useNavigate()
  const [children, setChildren] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAge, setFilterAge] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [filterDisability, setFilterDisability] = useState('')
  const [interests, setInterests] = useState([])

  useEffect(() => {
    fetchChildren()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [search, filterAge, filterGender, filterDisability, children])

  const fetchChildren = async () => {
    const { data } = await supabase
      .from('children')
      .select('*, badges(badge_name, badge_type), rankings(total_points, weekly_points, streak_days)')
    setChildren(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  const applyFilters = () => {
    let result = [...children]
    if (search) result = result.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.interests?.toLowerCase().includes(search.toLowerCase()))
    if (filterAge) result = result.filter(c => c.age_group === filterAge)
    if (filterGender) result = result.filter(c => c.gender === filterGender)
    if (filterDisability === 'yes') result = result.filter(c => c.disability)
    if (filterDisability === 'no') result = result.filter(c => !c.disability)
    setFiltered(result)
  }

  const expressInterest = async (childId) => {
    const { data: { user } } = await supabase.auth.getUser()
    alert('Interest expressed! The NGO will be notified and will contact you soon. 💙')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading children profiles...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-indigo-700">🌉 Find Your Child</h1>
              <p className="text-gray-500 text-sm mt-1">Browse children waiting for a family</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or interests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3"
          />

          {/* Filters */}
          <div className="grid grid-cols-3 gap-3">
            <select
              value={filterAge}
              onChange={e => setFilterAge(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All Ages</option>
              <option value="toddler">Toddler (0-5)</option>
              <option value="primary">Primary (6-10)</option>
              <option value="middle">Middle (11-13)</option>
              <option value="senior">Senior (14+)</option>
            </select>

            <select
              value={filterGender}
              onChange={e => setFilterGender(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <select
              value={filterDisability}
              onChange={e => setFilterDisability(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All Children</option>
              <option value="yes">Special Needs 💛</option>
              <option value="no">Without Disability</option>
            </select>
          </div>

          <p className="text-gray-400 text-sm mt-3">{filtered.length} children found</p>
        </div>

        {/* Children Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-gray-500">No children found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(child => (
              <div key={child.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition">

                {/* Photo */}
                <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center relative">
                  {child.photo_url ? (
                    <img src={child.photo_url} alt={child.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-8xl">{child.gender === 'female' ? '👧' : '👦'}</span>
                  )}
                  {child.disability && (
                    <span className="absolute top-3 right-3 bg-yellow-400 text-white text-xs px-2 py-1 rounded-full font-bold">💛 Special</span>
                  )}
                  {child.rankings?.[0] && (
                    <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                      🏆 {child.rankings[0].total_points} pts
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{child.name}</h3>
                      <p className="text-gray-500 text-sm capitalize">{child.age} years • {child.gender} • {child.age_group}</p>
                    </div>
                    {child.rankings?.[0]?.streak_days > 0 && (
                      <span className="text-orange-500 text-sm font-bold">🔥 {child.rankings[0].streak_days}d</span>
                    )}
                  </div>

                  {child.bio && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{child.bio}</p>
                  )}

                  {child.interests && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {child.interests.split(',').map((interest, i) => (
                        <span key={i} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-1 rounded-full">{interest.trim()}</span>
                      ))}
                    </div>
                  )}

                  {/* Badges */}
                  {child.badges && child.badges.length > 0 && (
                    <div className="flex gap-1 mb-3 flex-wrap">
                      {child.badges.slice(0, 4).map((badge, i) => (
                        <span key={i} className="text-lg" title={badge.badge_name}>
                          {badge.badge_name === 'Math Whiz' ? '🔢' :
                           badge.badge_name === 'English Expert' ? '📖' :
                           badge.badge_name === 'Science Star' ? '🔬' :
                           badge.badge_name === 'Hindi Hero' ? '🇮🇳' :
                           badge.badge_name === 'Common Sense Champion' ? '🧠' :
                           badge.badge_name === 'All Rounder' ? '🌟' :
                           badge.badge_name === 'On Fire' ? '🔥' :
                           badge.badge_name === 'Special Heart' ? '💛' : '🏅'}
                        </span>
                      ))}
                      {child.badges.length > 4 && <span className="text-xs text-gray-400">+{child.badges.length - 4} more</span>}
                    </div>
                  )}

                  <button
                    onClick={() => expressInterest(child.id)}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
                  >
                    💙 Express Interest
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BrowseChildren