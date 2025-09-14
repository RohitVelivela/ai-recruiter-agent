'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardStats {
  totalCandidates: number
  totalInterviews: number
  completedInterviews: number
  averageScore: number
  recentActivity: any[]
}

interface FilterOptions {
  status: string
  role: string
  scoreRange: [number, number]
  dateRange: string
}

export default function RecruiterDashboard() {
  const { profile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    totalInterviews: 0,
    completedInterviews: 0,
    averageScore: 0,
    recentActivity: []
  })
  const [candidates, setCandidates] = useState<any[]>([])
  const [interviews, setInterviews] = useState<any[]>([])
  const [jobPositions, setJobPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'interviews' | 'jobs'>('overview')
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    role: 'all',
    scoreRange: [0, 100],
    dateRange: 'all'
  })

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (profile && (profile.role === 'recruiter' || profile.role === 'admin')) {
      loadDashboardData()
    } else if (!authLoading && profile?.role === 'candidate') {
      router.push('/candidate/profile')
    }
  }, [profile, authLoading])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load candidates with their applications and interviews
      const { data: candidatesData } = await supabase
        .from('candidates')
        .select(`
          *,
          applications (
            *,
            job_positions (
              title,
              department
            )
          ),
          interviews (
            *,
            job_positions (
              title
            )
          )
        `)
        .order('created_at', { ascending: false })

      // Load interviews with candidate and job information
      const { data: interviewsData } = await supabase
        .from('interviews')
        .select(`
          *,
          candidates (
            first_name,
            last_name,
            email,
            skills
          ),
          job_positions (
            title,
            department
          )
        `)
        .order('created_at', { ascending: false })

      // Load job positions
      const { data: jobsData } = await supabase
        .from('job_positions')
        .select(`
          *,
          applications (count),
          interviews (count)
        `)
        .order('created_at', { ascending: false })

      // Calculate stats
      const totalCandidates = candidatesData?.length || 0
      const totalInterviews = interviewsData?.length || 0
      const completedInterviews = interviewsData?.filter(i => i.status === 'completed').length || 0
      const averageScore = interviewsData?.reduce((acc, interview) => {
        return acc + (interview.ai_score || 0)
      }, 0) / Math.max(completedInterviews, 1)

      setStats({
        totalCandidates,
        totalInterviews,
        completedInterviews,
        averageScore: Math.round(averageScore || 0),
        recentActivity: interviewsData?.slice(0, 5) || []
      })

      setCandidates(candidatesData || [])
      setInterviews(interviewsData || [])
      setJobPositions(jobsData || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCandidates = candidates.filter(candidate => {
    if (filters.status !== 'all' && candidate.status !== filters.status) return false
    return true
  })

  const filteredInterviews = interviews.filter(interview => {
    if (filters.status !== 'all' && interview.status !== filters.status) return false
    if (filters.scoreRange && interview.ai_score !== null) {
      if (interview.ai_score < filters.scoreRange[0] || interview.ai_score > filters.scoreRange[1]) return false
    }
    return true
  })

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      applied: 'bg-blue-100 text-blue-800',
      screening: 'bg-yellow-100 text-yellow-800',
      interviewed: 'bg-purple-100 text-purple-800',
      passed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      scheduled: 'bg-orange-100 text-orange-800',
      'in_progress': 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }

    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  if (authLoading || loading) {
    return <div className="p-8">Loading dashboard...</div>
  }

  if (!profile || (profile.role !== 'recruiter' && profile.role !== 'admin')) {
    return <div className="p-8">Access denied. Recruiter privileges required.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
              <p className="text-gray-600">Welcome back, {profile.full_name}</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/dashboard/jobs/new"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Create Job
              </Link>
              <button
                onClick={() => {/* Add logout logic */}}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'candidates', label: 'Candidates' },
              { id: 'interviews', label: 'Interviews' },
              { id: 'jobs', label: 'Job Positions' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Total Candidates</h3>
                <p className="text-3xl font-bold text-indigo-600">{stats.totalCandidates}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Total Interviews</h3>
                <p className="text-3xl font-bold text-green-600">{stats.totalInterviews}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.completedInterviews}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Avg Score</h3>
                <p className={`text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>
                  {stats.averageScore}
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Recent Interview Activity</h3>
              </div>
              <div className="p-6">
                {stats.recentActivity.length === 0 ? (
                  <p className="text-gray-500">No recent activity</p>
                ) : (
                  <div className="space-y-4">
                    {stats.recentActivity.map(interview => (
                      <div key={interview.id} className="flex items-center justify-between border-b pb-4">
                        <div>
                          <p className="font-medium">
                            {interview.candidates?.first_name} {interview.candidates?.last_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {interview.job_positions?.title} • {new Date(interview.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(interview.status)}`}>
                            {interview.status}
                          </span>
                          {interview.ai_score && (
                            <span className={`font-bold ${getScoreColor(interview.ai_score)}`}>
                              {interview.ai_score}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Candidates</h2>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="border rounded-md px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interviewed">Interviewed</option>
                <option value="passed">Passed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Experience</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCandidates.map(candidate => (
                      <tr key={candidate.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {candidate.first_name} {candidate.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{candidate.current_position}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {candidate.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {candidate.experience_years} years
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(candidate.status)}`}>
                            {candidate.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {candidate.applications?.[0]?.job_positions?.title || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/dashboard/candidates/${candidate.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Interviews</h2>
              <div className="flex space-x-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="all">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInterviews.map(interview => (
                      <tr key={interview.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {interview.candidates?.first_name} {interview.candidates?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{interview.candidates?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {interview.job_positions?.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(interview.status)}`}>
                            {interview.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-medium ${getScoreColor(interview.ai_score)}`}>
                            {interview.ai_score || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(interview.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/dashboard/interviews/${interview.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Job Positions</h2>
              <Link
                href="/dashboard/jobs/new"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Create New Job
              </Link>
            </div>

            <div className="grid gap-6">
              {jobPositions.map(job => (
                <div key={job.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-gray-600">{job.department} • {job.location}</p>
                      <p className="text-gray-700 mt-2">{job.description}</p>

                      {job.skills && job.skills.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2">
                            {job.skills.map((skill: string, index: number) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Applications: {job.applications?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500">
                        Interviews: {job.interviews?.length || 0}
                      </div>
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          job.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {job.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/dashboard/jobs/${job.id}/edit`}
                      className="text-gray-600 hover:text-gray-900 text-sm"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}