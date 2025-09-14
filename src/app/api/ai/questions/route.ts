import { NextRequest, NextResponse } from 'next/server'
import { createGeminiClient } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { jobPositionId } = await request.json()

    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    const supabase = createClient()

    // Get job position details
    const { data: jobPosition, error: jobError } = await supabase
      .from('job_positions')
      .select('*')
      .eq('id', jobPositionId)
      .single()

    if (jobError || !jobPosition) {
      return NextResponse.json({ error: 'Job position not found' }, { status: 404 })
    }

    const gemini = createGeminiClient(geminiApiKey)

    const questionSet = await gemini.generateInterviewQuestions(
      jobPosition.title,
      jobPosition.description || '',
      jobPosition.skills || [],
      jobPosition.experience_level || 'mid-level'
    )

    // Store the AI prompt for this job position
    const { data: aiPrompt, error: promptError } = await supabase
      .from('ai_prompts')
      .upsert({
        job_position_id: jobPositionId,
        role_title: jobPosition.title,
        system_prompt: `You are conducting an interview for ${jobPosition.title}. Use these questions and criteria.`,
        question_prompts: questionSet.questions,
        evaluation_criteria: questionSet.evaluationCriteria.join('; '),
        is_active: true
      })
      .select()
      .single()

    if (promptError) {
      console.error('Error storing AI prompt:', promptError)
    }

    return NextResponse.json(questionSet)
  } catch (error) {
    console.error('Error generating questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    )
  }
}