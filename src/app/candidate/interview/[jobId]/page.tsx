'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Script from 'next/script'

export default function InterviewPage() {
  const { jobId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [job, setJob] = useState<any>(null)
  const [candidate, setCandidate] = useState<any>(null)
  const [interview, setInterview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [callStarted, setCallStarted] = useState(false)
  const [assistantId, setAssistantId] = useState<string | null>(null)
  const [callId, setCallId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user && jobId) {
      loadData()
    }
  }, [user, jobId])

  const loadData = async () => {
    try {
      const { data: jobData } = await supabase
        .from('job_positions')
        .select('*')
        .eq('id', jobId)
        .single()

      const { data: candidateData } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (!candidateData) {
        router.push('/candidate/profile')
        return
      }

      const { data: interviewData } = await supabase
        .from('interviews')
        .select('*')
        .eq('candidate_id', candidateData.id)
        .eq('job_position_id', jobId)
        .single()

      if (!interviewData) {
        const { data: applicationData } = await supabase
          .from('applications')
          .select('*')
          .eq('candidate_id', candidateData.id)
          .eq('job_position_id', jobId)
          .single()

        if (applicationData) {
          const { data: newInterview } = await supabase
            .from('interviews')
            .insert({
              application_id: applicationData.id,
              candidate_id: candidateData.id,
              job_position_id: jobId,
              status: 'scheduled',
            })
            .select()
            .single()

          setInterview(newInterview)
        }
      } else {
        setInterview(interviewData)
      }

      setJob(jobData)
      setCandidate(candidateData)
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  const generateInterviewQuestions = (job: any) => {
    const baseQuestions = [
      'Tell me about yourself and your background.',
      'What interests you about this position?',
      'Can you describe a challenging project you worked on recently?',
      'How do you handle working under pressure or tight deadlines?',
      'Where do you see yourself in 5 years?'
    ]

    if (job?.skills && job.skills.length > 0) {
      baseQuestions.push(`Can you elaborate on your experience with ${job.skills.slice(0, 3).join(', ')}?`)
    }

    if (job?.requirements && job.requirements.length > 0) {
      baseQuestions.push(`How does your experience align with our requirement for ${job.requirements[0]}?`)
    }

    return baseQuestions
  }

  const startInterview = async () => {
    if (!job || !candidate || !interview) return

    try {
      setLoading(true)

      const questions = generateInterviewQuestions(job)

      const assistantResponse = await fetch('/api/vapi/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: job.title,
          jobDescription: job.description || `${job.title} position at ${job.department}`,
          questions,
          candidateName: `${candidate.first_name} ${candidate.last_name}`,
        }),
      })

      if (!assistantResponse.ok) {
        throw new Error('Failed to create assistant')
      }

      const { assistantId } = await assistantResponse.json()
      setAssistantId(assistantId)

      const callResponse = await fetch('/api/vapi/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId,
          interviewId: interview.id,
        }),
      })

      if (!callResponse.ok) {
        throw new Error('Failed to start call')
      }

      const { callId } = await callResponse.json()
      setCallId(callId)

      if (typeof window !== 'undefined' && window.startVapiCall) {
        window.startVapiCall()
      }

      setCallStarted(true)
    } catch (error) {
      console.error('Error starting interview:', error)
      alert('Failed to start interview. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const endInterview = async () => {
    if (typeof window !== 'undefined' && window.endVapiCall) {
      window.endVapiCall()
    }

    if (callId && interview) {
      try {
        const callResponse = await fetch(`/api/vapi/call?callId=${callId}`)
        if (callResponse.ok) {
          const callData = await callResponse.json()

          await supabase
            .from('interviews')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              transcript: callData.transcript,
              audio_url: callData.recordingUrl,
            })
            .eq('id', interview.id)
        }

        router.push('/candidate/profile')
      } catch (error) {
        console.error('Error ending interview:', error)
      }
    }

    setCallStarted(false)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.onCallStart = () => {
        console.log('Interview call started')
      }

      window.onCallEnd = (callData: any) => {
        console.log('Interview call ended', callData)
        endInterview()
      }

      window.onCallError = (error: any) => {
        console.error('Interview call error', error)
        alert('There was an error with the interview call.')
        setCallStarted(false)
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.onCallStart = undefined
        window.onCallEnd = undefined
        window.onCallError = undefined
      }
    }
  }, [callId, interview])

  if (loading) return <div className="p-8">Loading interview...</div>

  if (!job || !candidate) {
    return <div className="p-8">Job or candidate data not found.</div>
  }

  return (
    <>
      <Script
        src="https://cdn.vapi.ai/web-sdk.js"
        strategy="afterInteractive"
      />
      {assistantId && (
        <Script id="vapi-config" strategy="afterInteractive">
          {`
            const vapiPublicKey = '${process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY}';
            const assistantId = '${assistantId}';

            let vapiCall = null;

            function startCall() {
              if (vapiCall) return;

              vapiCall = window.Vapi.create({
                publicKey: vapiPublicKey,
                assistantId: assistantId,
              });

              vapiCall.start();

              vapiCall.on('call-start', () => {
                console.log('Call started');
                window.onCallStart && window.onCallStart();
              });

              vapiCall.on('call-end', (callData) => {
                console.log('Call ended', callData);
                window.onCallEnd && window.onCallEnd(callData);
                vapiCall = null;
              });

              vapiCall.on('error', (error) => {
                console.error('Call error', error);
                window.onCallError && window.onCallError(error);
              });
            }

            function endCall() {
              if (vapiCall) {
                vapiCall.stop();
              }
            }

            window.startVapiCall = startCall;
            window.endVapiCall = endCall;
          `}
        </Script>
      )}

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Interview</h1>
              <p className="text-lg text-gray-600">{job.title}</p>
              <p className="text-sm text-gray-500">{job.department} • {job.location}</p>
            </div>

            {!callStarted ? (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-blue-900 mb-2">Interview Instructions</h2>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li>• Make sure you're in a quiet environment</li>
                    <li>• Check your microphone and internet connection</li>
                    <li>• The interview will take approximately 15-20 minutes</li>
                    <li>• You'll be speaking with an AI recruiter named Sarah</li>
                    <li>• Answer questions clearly and take your time</li>
                    <li>• You can end the interview at any time by clicking "End Interview"</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">About This Position</h3>
                  <p className="text-gray-700 mb-3">{job.description}</p>

                  {job.skills && job.skills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Key Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <button
                    onClick={startInterview}
                    disabled={loading}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Starting Interview...' : 'Start AI Interview'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-green-800 font-semibold">Interview in Progress</span>
                  </div>
                  <p className="text-green-700">
                    You're now speaking with Sarah, our AI recruiter. Please answer the questions clearly and take your time.
                  </p>
                </div>

                <div className="bg-gray-100 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Speak naturally and wait for questions. The AI can hear you clearly.
                  </p>
                </div>

                <button
                  onClick={endInterview}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                >
                  End Interview
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}