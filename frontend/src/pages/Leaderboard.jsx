import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

function Leaderboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('weekly')
  const [rankings, setRankings] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [child, setChild] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: childData } = await supabase
      .from('children')
      .select('*')
      .eq('profile_id', user.id)
      .single()

    setChild(childData)

    const pointsField = activeTab === 'weekly' ? 'weekly_points'
      : activeTab === 'monthly' ? 'monthly_points'
      : 'total_points'

    const { data: rankData } = await supabase
      .from('rankings')
      .select('*, children(name, age, age_group, disability)')
      .order(pointsField, { ascending: false })

    if (rankData) {
      setRankings(rankData)
      if (childData) {
        const myIndex = rankData.findIndex(r => r.child_id === childData.id)
        if (myIndex !== -1) setMyRank({ ...rankData[myIndex], position: myIndex + 1 })
      }
    }

    setLoading(false)
  }

  const getPointsForTab = (item) => {
    if (activeTab === 'weekly') return item.weekly_points
    if (activeTab === 'monthly') return item.monthly_points
    return item.total_points
  }

  const getMedal = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  const getTabLabel = () => {
    if (activeTab === 'weekly') return 'This Week'
    if (activeTab === 'monthly') return 'This Month'
    return 'All Time'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-indigo-700">🏆 Leaderboard</h1>
              <p className="text-gray-500 text-sm mt-1">AdoptBridge Rankings</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {['weekly', 'monthly', 'alltime'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {tab === 'weekly' ? '📅 Weekly' : tab === 'monthly' ? '📆 Monthly' : '🌟 All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* My Rank Card */}
        {myRank && (
          <div className="bg-indigo-600 rounded-2xl shadow-xl p-5 mb-4 text-white">
            <p className="text-indigo-200 text-sm mb-1">Your Ranking — {getTabLabel()}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold">
                  {getMedal(myRank.position - 1)}
                </div>
                <div>
                  <p className="font-bold text-lg">{myRank.children?.name}</p>
                  <p className="text-indigo-200 text-sm capitalize">{myRank.children?.age_group} • {myRank.streak_days} day streak 🔥</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{getPointsForTab(myRank)}</p>
                <p className="text-indigo-200 text-sm">points</p>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {!loading && rankings.length >= 3 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
            <h2 className="text-center font-bold text-gray-700 mb-4">🏅 Top 3 Champions</h2>
            <div className="flex items-end justify-center gap-3">

              {/* 2nd Place */}
              <div className="text-center flex-1">
                <div className="text-3xl mb-1">🥈</div>
                <div className="bg-gray-100 rounded-t-xl p-3 h-20 flex flex-col justify-center">
                  <p className="font-bold text-sm text-gray-700 truncate">{rankings[1]?.children?.name}</p>
                  <p className="text-indigo-600 font-bold">{getPointsForTab(rankings[1])}</p>
                  <p className="text-xs text-gray-400">pts</p>
                </div>
              </div>

              {/* 1st Place */}
              <div className="text-center flex-1">
                <div className="text-4xl mb-1">🥇</div>
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-t-xl p-3 h-28 flex flex-col justify-center">
                  <p className="font-bold text-sm text-gray-700 truncate">{rankings[0]?.children?.name}</p>
                  <p className="text-yellow-600 font-bold text-lg">{getPointsForTab(rankings[0])}</p>
                  <p className="text-xs text-gray-400">pts</p>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="text-center flex-1">
                <div className="text-3xl mb-1">🥉</div>
                <div className="bg-orange-50 rounded-t-xl p-3 h-16 flex flex-col justify-center">
                  <p className="font-bold text-sm text-gray-700 truncate">{rankings[2]?.children?.name}</p>
                  <p className="text-orange-600 font-bold">{getPointsForTab(rankings[2])}</p>
                  <p className="text-xs text-gray-400">pts</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Full Rankings List */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="font-bold text-gray-700 mb-4">{getTabLabel()} Rankings</h2>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading rankings...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🏁</p>
              <p className="text-gray-500">No rankings yet! Be the first to complete an assessment.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rankings.map((item, index) => {
                const isMe = child && item.child_id === child.id
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition ${isMe ? 'bg-indigo-50 border-2 border-indigo-300' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-indigo-50 text-indigo-600'}`}>
                      {getMedal(index)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold truncate ${isMe ? 'text-indigo-700' : 'text-gray-800'}`}>
                          {item.children?.name} {isMe ? '(You)' : ''}
                        </p>
                        {item.children?.disability && (
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full flex-shrink-0">💛 Special</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 capitalize">{item.children?.age_group}</span>
                        {item.streak_days > 0 && (
                          <span className="text-xs text-orange-500">🔥 {item.streak_days} day streak</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-lg ${isMe ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {getPointsForTab(item)}
                      </p>
                      <p className="text-xs text-gray-400">pts</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Leaderboard