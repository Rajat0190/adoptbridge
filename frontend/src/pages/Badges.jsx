import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

const BADGE_RULES = [
  { name: 'Math Whiz', icon: '🔢', description: 'Score 5/5 in Math', type: 'skill', subject: 'Math', minScore: 5 },
  { name: 'English Expert', icon: '📖', description: 'Score 5/5 in English', type: 'skill', subject: 'English', minScore: 5 },
  { name: 'Science Star', icon: '🔬', description: 'Score 5/5 in Science', type: 'skill', subject: 'Science', minScore: 5 },
  { name: 'Hindi Hero', icon: '🇮🇳', description: 'Score 5/5 in Hindi', type: 'skill', subject: 'Hindi', minScore: 5 },
  { name: 'Common Sense Champion', icon: '🧠', description: 'Score 5/5 in Common Sense', type: 'skill', subject: 'Common Sense', minScore: 5 },
  { name: 'All Rounder', icon: '🌟', description: 'Complete all 5 subjects in one day', type: 'achievement' },
  { name: 'On Fire', icon: '🔥', description: '3 day streak', type: 'streak', minStreak: 3 },
  { name: 'Week Warrior', icon: '⚔️', description: '7 day streak', type: 'streak', minStreak: 7 },
  { name: 'Unstoppable', icon: '💎', description: '30 day streak', type: 'streak', minStreak: 30 },
  { name: 'Top Scorer', icon: '🏆', description: 'Reach 500 total points', type: 'points', minPoints: 500 },
  { name: 'Point Master', icon: '👑', description: 'Reach 1000 total points', type: 'points', minPoints: 1000 },
  { name: 'Special Heart', icon: '💛', description: 'Awarded to children with special needs', type: 'special' },
  { name: 'Perfect Day', icon: '✨', description: 'Score 50/50 in one day', type: 'achievement' },
  { name: 'First Step', icon: '👣', description: 'Complete your first assessment', type: 'achievement' },
  { name: 'Knowledge Seeker', icon: '📚', description: 'Complete 10 assessments total', type: 'achievement' },
]

function Badges() {
  const navigate = useNavigate()
  const [child, setChild] = useState(null)
  const [ranking, setRanking] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [earnedBadges, setEarnedBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [awarding, setAwarding] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const { data: childData } = await supabase
      .from('children')
      .select('*')
      .eq('profile_id', user.id)
      .single()

    if (!childData) { setLoading(false); return }
    setChild(childData)

    const { data: rankData } = await supabase
      .from('rankings')
      .select('*')
      .eq('child_id', childData.id)
      .single()
    setRanking(rankData)

    const { data: assessmentData } = await supabase
      .from('assessments')
      .select('*')
      .eq('child_id', childData.id)
    setAssessments(assessmentData || [])

    const { data: badgeData } = await supabase
      .from('badges')
      .select('*')
      .eq('child_id', childData.id)
    setEarnedBadges(badgeData || [])

    await checkAndAwardBadges(childData, rankData, assessmentData || [], badgeData || [])
    setLoading(false)
  }

  const checkAndAwardBadges = async (childData, rankData, assessmentData, currentBadges) => {
    setAwarding(true)
    const newBadges = []
    const existingNames = currentBadges.map(b => b.badge_name)

    // First Step
    if (assessmentData.length > 0 && !existingNames.includes('First Step')) {
      newBadges.push({ child_id: childData.id, badge_name: 'First Step', badge_type: 'achievement' })
    }

    // Knowledge Seeker
    if (assessmentData.length >= 10 && !existingNames.includes('Knowledge Seeker')) {
      newBadges.push({ child_id: childData.id, badge_name: 'Knowledge Seeker', badge_type: 'achievement' })
    }

    // Skill badges — score 5/5
    const subjects = ['Math', 'English', 'Science', 'Hindi', 'Common Sense']
    subjects.forEach(subject => {
      const badgeName = BADGE_RULES.find(b => b.subject === subject)?.name
      const perfect = assessmentData.some(a => a.subject === subject && a.score === 5)
      if (perfect && badgeName && !existingNames.includes(badgeName)) {
        newBadges.push({ child_id: childData.id, badge_name: badgeName, badge_type: 'skill' })
      }
    })

    // All Rounder — all 5 subjects in one day
    const byDate = {}
    assessmentData.forEach(a => {
      const date = a.taken_at?.split('T')[0]
      if (!byDate[date]) byDate[date] = new Set()
      byDate[date].add(a.subject)
    })
    const allRounder = Object.values(byDate).some(s => s.size >= 5)
    if (allRounder && !existingNames.includes('All Rounder')) {
      newBadges.push({ child_id: childData.id, badge_name: 'All Rounder', badge_type: 'achievement' })
    }

    // Perfect Day — 50/50 in one day
    const scoreByDate = {}
    assessmentData.forEach(a => {
      const date = a.taken_at?.split('T')[0]
      if (!scoreByDate[date]) scoreByDate[date] = 0
      scoreByDate[date] += a.score
    })
    const perfectDay = Object.values(scoreByDate).some(s => s >= 25)
    if (perfectDay && !existingNames.includes('Perfect Day')) {
      newBadges.push({ child_id: childData.id, badge_name: 'Perfect Day', badge_type: 'achievement' })
    }

    // Streak badges
    if (rankData) {
      if (rankData.streak_days >= 3 && !existingNames.includes('On Fire')) {
        newBadges.push({ child_id: childData.id, badge_name: 'On Fire', badge_type: 'streak' })
      }
      if (rankData.streak_days >= 7 && !existingNames.includes('Week Warrior')) {
        newBadges.push({ child_id: childData.id, badge_name: 'Week Warrior', badge_type: 'streak' })
      }
      if (rankData.streak_days >= 30 && !existingNames.includes('Unstoppable')) {
        newBadges.push({ child_id: childData.id, badge_name: 'Unstoppable', badge_type: 'streak' })
      }

      // Points badges
      if (rankData.total_points >= 500 && !existingNames.includes('Top Scorer')) {
        newBadges.push({ child_id: childData.id, badge_name: 'Top Scorer', badge_type: 'points' })
      }
      if (rankData.total_points >= 1000 && !existingNames.includes('Point Master')) {
        newBadges.push({ child_id: childData.id, badge_name: 'Point Master', badge_type: 'points' })
      }
    }

    // Special Heart badge for disability
    if (childData.disability && !existingNames.includes('Special Heart')) {
      newBadges.push({ child_id: childData.id, badge_name: 'Special Heart', badge_type: 'special' })
    }

    if (newBadges.length > 0) {
      await supabase.from('badges').insert(newBadges)
      const { data: updatedBadges } = await supabase
        .from('badges')
        .select('*')
        .eq('child_id', childData.id)
      setEarnedBadges(updatedBadges || [])
    }

    setAwarding(false)
  }

  const isEarned = (badgeName) => earnedBadges.some(b => b.badge_name === badgeName)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Checking your badges...</p>
    </div>
  )

  if (!child) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-8 text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">No Child Profile Found</h2>
        <button onClick={() => navigate('/dashboard')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg mt-4">Back</button>
      </div>
    </div>
  )

  const earned = BADGE_RULES.filter(b => isEarned(b.name))
  const unearned = BADGE_RULES.filter(b => !isEarned(b.name))

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-yellow-600">🏅 My Badges</h1>
              <p className="text-gray-500 text-sm mt-1">{child.name}'s Achievement Wall</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-yellow-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{earned.length}</p>
              <p className="text-xs text-gray-500">Earned</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-400">{unearned.length}</p>
              <p className="text-xs text-gray-500">Locked</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-indigo-600">{ranking?.total_points || 0}</p>
              <p className="text-xs text-gray-500">Total pts</p>
            </div>
          </div>
        </div>

        {awarding && (
          <div className="bg-yellow-100 rounded-xl p-3 mb-4 text-center text-yellow-700 text-sm font-medium">
            🎉 Checking for new badges...
          </div>
        )}

        {/* Earned Badges */}
        {earned.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
            <h2 className="font-bold text-gray-700 mb-4">✅ Earned Badges ({earned.length})</h2>
            <div className="grid grid-cols-3 gap-3">
              {earned.map((badge, i) => (
                <div key={i} className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-3 text-center">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <p className="font-bold text-sm text-gray-800">{badge.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block font-medium ${badge.type === 'skill' ? 'bg-blue-100 text-blue-700' : badge.type === 'streak' ? 'bg-orange-100 text-orange-700' : badge.type === 'points' ? 'bg-purple-100 text-purple-700' : badge.type === 'special' ? 'bg-pink-100 text-pink-700' : 'bg-green-100 text-green-700'}`}>
                    {badge.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Badges */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="font-bold text-gray-700 mb-4">🔒 Locked Badges ({unearned.length})</h2>
          <div className="grid grid-cols-3 gap-3">
            {unearned.map((badge, i) => (
              <div key={i} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-center opacity-60">
                <div className="text-4xl mb-2 grayscale">{badge.icon}</div>
                <p className="font-bold text-sm text-gray-500">{badge.name}</p>
                <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Badges