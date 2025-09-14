import { NextRequest, NextResponse } from 'next/server'
import { createGeminiClient } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { interviewId } = await request.json()

    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    const supabase = createClient()

    // Get interview details with related data
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select(`
        *,
        job_positions (
          title,
          description,
          skills,
          requirements
        ),
        candidates (
          first_name,
          last_name,
          skills
        )
      `)
      .eq('id', interviewId)
      .single()

    if (interviewError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    if (!interview.transcript) {
      return NextResponse.json({ error: 'No transcript available for evaluation' }, { status: 400 })
    }

    const gemini = createGeminiClient(geminiApiKey)

    const evaluation = await gemini.evaluateInterview(
      interview.transcript,
      interview.job_positions.title,
      interview.job_positions.description || '',
      interview.questions_asked || [],
      interview.job_positions.skills || []
    )

    // Update the interview with AI evaluation results
    const { error: updateError } = await supabase
      .from('interviews')
      .update({
        ai_summary: evaluation.summary,
        ai_score: evaluation.score,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
      })
      .eq('id', interviewId)

    if (updateError) {
      console.error('Error updating interview evaluation:', updateError)
    }

    // Update application status based on evaluation
    let newStatus: 'passed' | 'rejected' | 'interviewed' = 'interviewed'
    if (evaluation.recommendation === 'hire') {
      newStatus = 'passed'
    } else if (evaluation.recommendation === 'no-hire') {
      newStatus = 'rejected'
    }

    const { error: statusError } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', interview.application_id)

    if (statusError) {
      console.error('Error updating application status:', statusError)
    }

    return NextResponse.json({
      evaluation,
      status: newStatus
    })
  } catch (error) {
    console.error('Error evaluating interview:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate interview' },
      { status: 500 }
    )
  }
}