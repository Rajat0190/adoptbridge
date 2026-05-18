import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

function ParentProfile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [caraResult, setCaraResult] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    marital_status: '',
    spouse_age: '',
    occupation: '',
    income_range: '',
    health_condition: 'none',
    married_years: '',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const checkCARA = () => {
    const issues = []
    const age = parseInt(formData.age)
    const spouseAge = parseInt(formData.spouse_age)
    const marriedYears = parseInt(formData.married_years)

    if (age < 25) issues.push('Minimum age requirement is 25 years')
    if (age > 55 && formData.marital_status === 'single') issues.push('Single parents must be under 55 years')
    if (formData.marital_status === 'married' && spouseAge) {
      const compositeAge = age + spouseAge
      if (compositeAge > 110) issues.push('Combined age of couple must not exceed 110 years')
    }
    if (formData.marital_status === 'married' && marriedYears < 2) {
      issues.push('Couples must be married for at least 2 years')
    }
    if (formData.health_condition !== 'none') {
      issues.push('Applicants with life-threatening medical conditions are not eligible')
    }

    return issues
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const issues = checkCARA()
    const eligible = issues.length === 0

    setCaraResult({ eligible, issues })

    if (!eligible) {
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const { error } = await supabase.from('parents').insert({
      profile_id: user.id,
      full_name: formData.full_name,
      age: parseInt(formData.age),
      marital_status: formData.marital_status,
      occupation: formData.occupation,
      income_range: formData.income_range,
      cara_eligible: eligible
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">Profile Submitted!</h2>
        <p className="text-gray-500 mb-2">You meet all CARA eligibility requirements.</p>
        <p className="text-gray-400 text-sm mb-6">Your profile will be reviewed by our admin team shortly.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-indigo-700">AdoptBridge 🌉</h1>
            <p className="text-gray-500 mt-2">Parent Registration — CARA Eligibility Check</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          {caraResult && !caraResult.eligible && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
              <h3 className="text-red-700 font-semibold mb-3">❌ CARA Eligibility Issues Found</h3>
              <ul className="space-y-2">
                {caraResult.issues.map((issue, i) => (
                  <li key={i} className="text-red-600 text-sm flex items-start gap-2">
                    <span>•</span> {issue}
                  </li>
                ))}
              </ul>
              <p className="text-red-500 text-xs mt-3">Please review CARA guidelines and ensure you meet all requirements before applying.</p>
            </div>
          )}

          <div className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Your full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Age"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                <select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">Select</option>
                  <option value="married">Married</option>
                  <option value="single">Single</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
            </div>

            {formData.marital_status === 'married' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spouse Age</label>
                  <input
                    type="number"
                    name="spouse_age"
                    value={formData.spouse_age}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Spouse age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years Married</label>
                  <input
                    type="number"
                    name="married_years"
                    value={formData.married_years}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Years married"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Your occupation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income Range</label>
              <select
                name="income_range"
                value={formData.income_range}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Select range</option>
                <option value="below_3L">Below ₹3 Lakhs</option>
                <option value="3L_5L">₹3 - 5 Lakhs</option>
                <option value="5L_10L">₹5 - 10 Lakhs</option>
                <option value="10L_20L">₹10 - 20 Lakhs</option>
                <option value="above_20L">Above ₹20 Lakhs</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Any life-threatening medical condition?</label>
              <select
                name="health_condition"
                value={formData.health_condition}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="none">No medical conditions</option>
                <option value="yes">Yes, I have a condition</option>
              </select>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-700">
              <p className="font-semibold mb-1">📋 CARA Guidelines Check</p>
              <p>Your details will be automatically verified against Central Adoption Resource Authority (CARA) eligibility requirements before submission.</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Checking eligibility...' : 'Check Eligibility & Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParentProfile