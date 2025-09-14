'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function InterviewDetailsPage() {
  const { interviewId } = useParams()
  const { profile } = useAuth()
  const [interview, setInterview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (profile && interviewId) {
      loadInterviewDetails()
    }
  }, [profile, interviewId])

  const loadInterviewDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          candidates (
            *
          ),
          job_positions (
            *
          ),
          applications (
            *
          ),
          interview_feedback (
            *,
            profiles (
              full_name
            )
          )
        `)
        .eq('id', interviewId)
        .single()

      if (error) throw error

      setInterview(data)
    } catch (error) {
      console.error('Error loading interview details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEvaluateInterview = async () => {
    if (!interview.transcript) {
      alert('No transcript available for evaluation')
      return
    }

    setEvaluating(true)

    try {
      const response = await fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId: interview.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to evaluate interview')
      }

      const result = await response.json()

      // Reload interview details to show updated evaluation
      await loadInterviewDetails()

      alert(`Interview evaluated successfully. Score: ${result.evaluation.score}`)
    } catch (error) {
      console.error('Error evaluating interview:', error)
      alert('Failed to evaluate interview. Please try again.')
    } finally {
      setEvaluating(false)
    }
  }

  const handleAddFeedback = async (rating: number, feedback: string, recommendation: string) => {
    try {
      const { error } = await supabase
        .from('interview_feedback')
        .insert({
          interview_id: interview.id,
          recruiter_id: profile?.id,
          rating,
          feedback,
          recommendation,
        })

      if (error) throw error

      await loadInterviewDetails()
    } catch (error) {
      console.error('Error adding feedback:', error)
      alert('Failed to add feedback')
    }
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      scheduled: 'bg-orange-100 text-orange-800',
      'in_progress': 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }

    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) return <div className="p-8">Loading interview details...</div>

  if (!interview) return <div className="p-8">Interview not found.</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">Interview Details</h1>
            </div>
            <div className="flex space-x-3">
              {interview.status === 'completed' && interview.transcript && !interview.ai_summary && (
                <button
                  onClick={handleEvaluateInterview}
                  disabled={evaluating}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {evaluating ? 'Evaluating...' : 'Run AI Evaluation'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interview Overview */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Interview Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(interview.status)}`}>
                      {interview.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">AI Score</label>
                  <div className={`mt-1 text-2xl font-bold ${getScoreColor(interview.ai_score)}`}>
                    {interview.ai_score || 'Not evaluated'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="mt-1">{interview.duration_minutes ? `${interview.duration_minutes} minutes` : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="mt-1">{new Date(interview.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* AI Evaluation */}
            {interview.ai_summary && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">AI Evaluation</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Summary</h3>
                    <p className="mt-1 text-gray-700">{interview.ai_summary}</p>
                  </div>

                  {interview.strengths && interview.strengths.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900">Strengths</h3>
                      <ul className="mt-1 list-disc list-inside text-gray-700">
                        {interview.strengths.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interview.weaknesses && interview.weaknesses.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900">Areas for Improvement</h3>
                      <ul className="mt-1 list-disc list-inside text-gray-700">
                        {interview.weaknesses.map((weakness: string, index: number) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transcript */}
            {interview.transcript && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Interview Transcript</h2>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {interview.transcript}
                  </pre>
                </div>
                {interview.audio_url && (
                  <div className="mt-4">
                    <audio controls className="w-full">
                      <source src={interview.audio_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
              </div>
            )}

            {/* Questions Asked */}
            {interview.questions_asked && interview.questions_asked.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Questions Asked</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  {interview.questions_asked.map((question: string, index: number) => (
                    <li key={index}>{question}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Recruiter Feedback */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recruiter Feedback</h2>

              {interview.interview_feedback && interview.interview_feedback.length > 0 ? (
                <div className="space-y-4">
                  {interview.interview_feedback.map((feedback: any, index: number) => (
                    <div key={index} className="border-l-4 border-indigo-500 pl-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{feedback.profiles.full_name}</p>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`h-5 w-5 ${
                                star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 text-gray-700">{feedback.feedback}</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        Recommendation: {feedback.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recruiter feedback yet.</p>
              )}

              {/* Add Feedback Form */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-3">Add Your Feedback</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    handleAddFeedback(
                      parseInt(formData.get('rating') as string),
                      formData.get('feedback') as string,
                      formData.get('recommendation') as string
                    )
                    e.currentTarget.reset()
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating (1-5)</label>
                    <select name="rating" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Average</option>
                      <option value="2">2 - Below Average</option>
                      <option value="1">1 - Poor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Feedback</label>
                    <textarea
                      name="feedback"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Your detailed feedback about the candidate..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recommendation</label>
                    <select name="recommendation" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="hire">Hire</option>
                      <option value="maybe">Maybe</option>
                      <option value="no-hire">No Hire</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Add Feedback
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Candidate Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Candidate</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {interview.candidates.first_name} {interview.candidates.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{interview.candidates.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Experience</p>
                  <p className="text-sm text-gray-600">{interview.candidates.experience_years} years</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Current Position</p>
                  <p className="text-sm text-gray-600">{interview.candidates.current_position || 'N/A'}</p>
                </div>
                {interview.candidates.resume_url && (
                  <a
                    href={interview.candidates.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                  >
                    View Resume
                  </a>
                )}
              </div>
            </div>

            {/* Job Position */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Position</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">{interview.job_positions.title}</p>
                  <p className="text-sm text-gray-600">{interview.job_positions.department}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Location</p>
                  <p className="text-sm text-gray-600">{interview.job_positions.location}</p>
                </div>
                {interview.job_positions.skills && interview.job_positions.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Required Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {interview.job_positions.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}