import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import { getRandomQuestions } from '../data/questions'

const SUBJECTS = [
  { name: 'Math', icon: '🔢', color: 'bg-blue-600' },
  { name: 'English', icon: '📖', color: 'bg-green-600' },
  { name: 'Science', icon: '🔬', color: 'bg-purple-600' },
  { name: 'Hindi', icon: '🇮🇳', color: 'bg-orange-600' },
  { name: 'Common Sense', icon: '🧠', color: 'bg-pink-600' },
]

function Assessment() {
  const navigate = useNavigate()
  const [child, setChild] = useState(null)
  const [classGroup, setClassGroup] = useState(null)
  const [classLocked, setClassLocked] = useState(false)
  const [phase, setPhase] = useState('select-class') 
  // phases: select-class → subject-intro → question → subject-result → final-result
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [answers, setAnswers] = useState([])
  const [subjectScores, setSubjectScores] = useState([])
  const [currentScore, setCurrentScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rank, setRank] = useState(null)

  useEffect(() => {
    async function getChild() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }
      const { data } = await supabase
        .from('children')
        .select('*')
        .eq('profile_id', user.id)
        .single()
      setChild(data)
      setLoading(false)
    }
    getChild()
  }, [])

  const getClassGroup = (age) => {
    if (age <= 7) return 'Class 1-2'
    if (age <= 9) return 'Class 3-4'
    if (age <= 11) return 'Class 5-6'
    if (age <= 13) return 'Class 7-8'
    if (age <= 15) return 'Class 9-10'
    return 'Class 11-12'
  }

  const startAssessment = () => {
    const group = classGroup || getClassGroup(child?.age || 10)
    setClassLocked(true)
    const qs = getRandomQuestions(group, SUBJECTS[0].name, 5)
    setQuestions(qs)
    setCurrent(0)
    setAnswers([])
    setSelectedOption(null)
    setPhase('subject-intro')
  }

  const beginSubject = () => {
    const group = classGroup || getClassGroup(child?.age || 10)
    const qs = getRandomQuestions(group, SUBJECTS[currentSubjectIndex].name, 5)
    setQuestions(qs)
    setCurrent(0)
    setAnswers([])
    setSelectedOption(null)
    setPhase('question')
  }

  const handleSubmitAnswer = async () => {
    if (!selectedOption) return

    const newAnswers = [...answers, selectedOption]
    setAnswers(newAnswers)
    setSelectedOption(null)

    if (current + 1 >= questions.length) {
      const finalScore = newAnswers.filter((a, i) => a === questions[i].answer).length
      setCurrentScore(finalScore)
      setSaving(true)

      await supabase.from('assessments').insert({
        child_id: child.id,
        subject: SUBJECTS[currentSubjectIndex].name,
        score: finalScore,
        total: questions.length,
        age_group: classGroup || getClassGroup(child?.age || 10)
      })

      const points = finalScore * 10
      const { data: existing } = await supabase
        .from('rankings')
        .select('*')
        .eq('child_id', child.id)
        .single()

      if (existing) {
        await supabase.from('rankings').update({
          total_points: existing.total_points + points,
          weekly_points: existing.weekly_points + points,
          monthly_points: existing.monthly_points + points,
          last_active: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        }).eq('child_id', child.id)
      } else {
        await supabase.from('rankings').insert({
          child_id: child.id,
          total_points: points,
          weekly_points: points,
          monthly_points: points,
          streak_days: 1,
          last_active: new Date().toISOString().split('T')[0]
        })
      }

      setSubjectScores(prev => [...prev, { subject: SUBJECTS[currentSubjectIndex].name, score: finalScore, points, answers: newAnswers, questions }])
      setSaving(false)
      setPhase('subject-result')
    } else {
      setCurrent(current + 1)
    }
  }

  const goToNextSubject = async () => {
    if (currentSubjectIndex + 1 >= SUBJECTS.length) {
      const { data: rankData } = await supabase
        .from('rankings')
        .select('*')
        .eq('child_id', child.id)
        .single()
      setRank(rankData)
      setPhase('final-result')
    } else {
      setCurrentSubjectIndex(prev => prev + 1)
      setPhase('subject-intro')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading your profile...</p>
    </div>
  )

  if (!child) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-8 text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">No Child Profile Found</h2>
        <p className="text-gray-500 mb-4">Please ask your NGO worker to register your profile first.</p>
        <button onClick={() => navigate('/dashboard')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg">Back to Dashboard</button>
      </div>
    </div>
  )

  // PHASE 1 — Select Class
  if (phase === 'select-class') return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">AdoptBridge 🌉</h1>
          <p className="text-gray-500 mt-1">Daily Assessment</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-5 mb-6">
          <p className="text-indigo-700 font-semibold text-lg">👋 Hello, {child.name}!</p>
          <p className="text-indigo-600 text-sm mt-1">You will complete <strong>5 subjects</strong> today</p>
          <p className="text-indigo-500 text-xs mt-1">Math • English • Science • Hindi • Common Sense</p>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select your class:</label>
          <select
            onChange={(e) => setClassGroup(e.target.value)}
            defaultValue={getClassGroup(child.age)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
          >
            {['Class 1-2', 'Class 3-4', 'Class 5-6', 'Class 7-8', 'Class 9-10', 'Class 11-12'].map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
        <button
          onClick={startAssessment}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition"
        >
          Start Assessment 🚀
        </button>
      </div>
    </div>
  )

  // PHASE 2 — Subject Intro
  if (phase === 'subject-intro') {
    const subj = SUBJECTS[currentSubjectIndex]
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="flex justify-center gap-2 mb-8">
            {SUBJECTS.map((s, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < currentSubjectIndex ? 'bg-green-500 text-white' : i === currentSubjectIndex ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {i < currentSubjectIndex ? '✓' : i + 1}
              </div>
            ))}
          </div>
          <div className="text-7xl mb-4">{subj.icon}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Subject {currentSubjectIndex + 1} of 5</h2>
          <h3 className="text-3xl font-bold text-indigo-700 mb-4">{subj.name}</h3>
          <p className="text-gray-500 mb-2">5 questions • 10 points each • 50 points max</p>
          <p className="text-gray-400 text-sm mb-8">Questions are randomly selected — do your best! 🎯</p>
          <button
            onClick={beginSubject}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition"
          >
            Begin {subj.name} →
          </button>
        </div>
      </div>
    )
  }

  // PHASE 3 — Question
  if (phase === 'question') return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-indigo-600 font-semibold">{SUBJECTS[currentSubjectIndex].icon} {SUBJECTS[currentSubjectIndex].name}</span>
          <span className="text-gray-500 text-sm">Q{current + 1} of {questions.length}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-8">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">{questions[current].q}</h2>
        <div className="space-y-3 mb-6">
          {questions[current].options.map((option, i) => (
            <button
              key={i}
              onClick={() => setSelectedOption(option)}
              className={`w-full text-left px-5 py-3 border-2 rounded-xl transition font-medium ${selectedOption === option ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:border-indigo-300'}`}
            >
              {String.fromCharCode(65 + i)}. {option}
            </button>
          ))}
        </div>
        <button
          onClick={handleSubmitAnswer}
          disabled={!selectedOption || saving}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Submit Answer →'}
        </button>
      </div>
    </div>
  )

  // PHASE 4 — Subject Result
  if (phase === 'subject-result') {
    const isLast = currentSubjectIndex + 1 >= SUBJECTS.length
    const lastResult = subjectScores[subjectScores.length - 1]
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="flex justify-center gap-2 mb-6">
            {SUBJECTS.map((s, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentSubjectIndex ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {i <= currentSubjectIndex ? '✓' : i + 1}
              </div>
            ))}
          </div>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{currentScore >= 4 ? '🏆' : currentScore >= 3 ? '🌟' : '💪'}</div>
            <h2 className="text-2xl font-bold text-gray-800">{SUBJECTS[currentSubjectIndex].name} Done!</h2>
            <div className="bg-indigo-50 rounded-xl p-4 mt-4">
              <p className="text-4xl font-bold text-indigo-700">{currentScore}/5</p>
              <p className="text-green-600 font-semibold">+{currentScore * 10} points earned</p>
            </div>
          </div>
          <div className="space-y-1 mb-6">
            {lastResult?.questions.map((q, i) => (
              <div key={i} className={`text-xs p-2 rounded-lg flex items-center gap-2 ${lastResult.answers[i] === q.answer ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <span>{lastResult.answers[i] === q.answer ? '✅' : '❌'}</span>
                <span className="truncate text-left">{q.q}</span>
              </div>
            ))}
          </div>
          {!isLast && (
            <div className="bg-blue-50 rounded-xl p-3 mb-4 text-center">
              <p className="text-blue-700 text-sm font-medium">Next up: {SUBJECTS[currentSubjectIndex + 1].icon} {SUBJECTS[currentSubjectIndex + 1].name}</p>
              <p className="text-blue-500 text-xs">{5 - currentSubjectIndex - 1} subject{5 - currentSubjectIndex - 1 !== 1 ? 's' : ''} remaining</p>
            </div>
          )}
          <button
            onClick={goToNextSubject}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition"
          >
            {isLast ? 'See Final Results 🎓' : `Next: ${SUBJECTS[currentSubjectIndex + 1].name} →`}
          </button>
        </div>
      </div>
    )
  }

  // PHASE 5 — Final Result
  if (phase === 'final-result') {
    const totalScore = subjectScores.reduce((sum, s) => sum + s.score, 0)
    const totalPoints = subjectScores.reduce((sum, s) => sum + s.points, 0)
    const totalPossible = SUBJECTS.length * 5
    const percentage = Math.round((totalScore / totalPossible) * 100)
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-3">
                {percentage >= 80 ? '🏆' : percentage >= 60 ? '🌟' : percentage >= 40 ? '💪' : '📚'}
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Assessment Complete!</h1>
              <p className="text-gray-500 mt-1">{child.name}'s Results</p>
            </div>

            <div className="bg-indigo-50 rounded-xl p-5 mb-6 text-center">
              <p className="text-5xl font-bold text-indigo-700">{totalScore}/{totalPossible}</p>
              <p className="text-gray-500 text-sm mt-1">Total Score</p>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                <div className="bg-indigo-600 h-3 rounded-full transition-all" style={{ width: `${percentage}%` }} />
              </div>
              <p className="text-indigo-600 font-bold mt-2">{percentage}%</p>
              <p className="text-green-600 font-semibold text-lg mt-1">+{totalPoints} points earned today! 🎉</p>
            </div>

            <div className="space-y-2 mb-6">
              {subjectScores.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                  <span className="text-gray-700 font-medium">{SUBJECTS[i].icon} {s.subject}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">{s.score}/5</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.score >= 4 ? 'bg-green-100 text-green-700' : s.score >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      +{s.points}pts
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {rank && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-center">
                <p className="text-yellow-700 font-semibold">🏅 Your Rankings</p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-700">{rank.total_points}</p>
                    <p className="text-xs text-gray-500">Total pts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{rank.weekly_points}</p>
                    <p className="text-xs text-gray-500">This week</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{rank.streak_days}</p>
                    <p className="text-xs text-gray-500">Day streak 🔥</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition"
            >
              Back to Dashboard 🏠
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default Assessment