import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

function ChildProfile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    disability: false,
    disability_type: '',
    disability_detail: '',
    interests: '',
    bio: '',
  })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const getAgeGroup = (age) => {
    if (age <= 5) return 'toddler'
    if (age <= 10) return 'primary'
    if (age <= 14) return 'middle'
    return 'senior'
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    let photo_url = null

    if (photo) {
      const fileExt = photo.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('child-photos')
        .upload(fileName, photo)

      if (!uploadError) {
        const { data } = supabase.storage
          .from('child-photos')
          .getPublicUrl(fileName)
        photo_url = data.publicUrl
      }
    }

    const { error } = await supabase.from('children').insert({
      profile_id: user.id,
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      disability: formData.disability,
      disability_type: formData.disability ? formData.disability_type : null,
      disability_detail: formData.disability ? formData.disability_detail : null,
      interests: formData.interests,
      bio: formData.bio,
      age_group: getAgeGroup(parseInt(formData.age)),
      photo_url
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
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">Profile Created!</h2>
        <p className="text-gray-500 mb-6">The child's profile has been successfully registered on AdoptBridge.</p>
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
            <p className="text-gray-500 mt-2">Register a Child Profile</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <div className="space-y-5">

            {/* Photo Upload */}
            <div className="text-center">
              <div className="w-28 h-28 mx-auto rounded-full bg-indigo-50 border-2 border-dashed border-indigo-300 flex items-center justify-center overflow-hidden mb-2">
                {photoPreview
                  ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                  : <span className="text-4xl">👦</span>
                }
              </div>
              <label className="cursor-pointer text-indigo-600 text-sm font-medium hover:underline">
                Upload Photo
                <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </label>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Child's Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Full name"
              />
            </div>

            {/* Age and Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="0"
                  max="18"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Age"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Disability */}
            <div className="bg-indigo-50 rounded-xl p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="disability"
                  checked={formData.disability}
                  onChange={handleChange}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="font-medium text-indigo-700">This child has a disability</span>
              </label>

              {formData.disability && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Disability Type</label>
                    <select
                      name="disability_type"
                      value={formData.disability_type}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="">Select type</option>
                      <option value="physical">Physical</option>
                      <option value="visual">Visual Impairment</option>
                      <option value="hearing">Hearing Impairment</option>
                      <option value="cognitive">Cognitive</option>
                      <option value="autism">Autism Spectrum</option>
                      <option value="multiple">Multiple Disabilities</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                    <input
                      type="text"
                      name="disability_detail"
                      value={formData.disability_detail}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="Any additional information"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interests & Hobbies</label>
              <input
                type="text"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="e.g. Drawing, Cricket, Dancing, Reading"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">About the Child</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Tell us about this child's personality, strengths and dreams..."
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving Profile...' : 'Register Child Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChildProfile