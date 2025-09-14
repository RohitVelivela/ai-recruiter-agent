'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/supabase/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']
type JobPosition = Database['public']['Tables']['job_positions']['Row']

export default function CandidateProfilePage() {
  const { user, profile } = useAuth()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    skills: [] as string[],
    experienceYears: 0,
    currentPosition: '',
  })

  useEffect(() => {
    if (user) {
      loadCandidateData()
      loadJobPositions()
    }
  }, [user])

  const loadCandidateData = async () => {
    if (!user) return

    const { data } = await supabase
      .from('candidates')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setCandidate(data)
      setFormData({
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone || '',
        linkedinUrl: data.linkedin_url || '',
        skills: data.skills || [],
        experienceYears: data.experience_years || 0,
        currentPosition: data.current_position || '',
      })
    } else {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
      }))
    }

    setLoading(false)
  }

  const loadJobPositions = async () => {
    const { data } = await supabase
      .from('job_positions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (data) {
      setJobPositions(data)
    }
  }

  const handleSkillAdd = (skill: string) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }))
    }
  }

  const handleSkillRemove = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return

    const file = event.target.files[0]
    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      await handleSaveProfile({ resumeUrl: publicUrl })
    } catch (error) {
      console.error('Error uploading resume:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async (additionalData?: { resumeUrl?: string }) => {
    if (!user) return

    setSaving(true)

    try {
      const candidateData = {
        user_id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        linkedin_url: formData.linkedinUrl,
        skills: formData.skills,
        experience_years: formData.experienceYears,
        current_position: formData.currentPosition,
        ...(additionalData?.resumeUrl && { resume_url: additionalData.resumeUrl })
      }

      if (candidate) {
        const { error } = await supabase
          .from('candidates')
          .update(candidateData)
          .eq('id', candidate.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('candidates')
          .insert(candidateData)

        if (error) throw error
      }

      await loadCandidateData()
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleApplyToJob = async (jobPositionId: string) => {
    if (!candidate) {
      alert('Please complete your profile first')
      return
    }

    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          candidate_id: candidate.id,
          job_position_id: jobPositionId,
        })

      if (error) throw error

      router.push(`/candidate/interview/${jobPositionId}`)
    } catch (error) {
      console.error('Error applying to job:', error)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Candidate Profile</h1>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                <input
                  type="url"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Current Position</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.currentPosition}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPosition: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleSkillRemove(skill)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add a skill and press Enter"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSkillAdd(e.currentTarget.value)
                    e.currentTarget.value = ''
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resume</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="mt-1 block w-full"
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-gray-500 mt-1">Uploading resume...</p>}
              {candidate?.resume_url && (
                <p className="text-sm text-green-600 mt-1">Resume uploaded successfully</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleSaveProfile()}
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Available Positions</h2>
          </div>

          <div className="p-6">
            {jobPositions.length === 0 ? (
              <p className="text-gray-500">No positions available at this time.</p>
            ) : (
              <div className="space-y-4">
                {jobPositions.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-gray-600">{job.department} • {job.location}</p>
                        <p className="text-gray-700 mt-2">{job.description}</p>

                        {job.skills && job.skills.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Required Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {job.skills.map((skill, index) => (
                                <span
                                  key={index}
                                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleApplyToJob(job.id)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        Apply & Interview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}