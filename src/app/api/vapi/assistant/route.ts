import { NextRequest, NextResponse } from 'next/server'
import { createVapiClient, createInterviewAssistant } from '@/lib/vapi'

export async function POST(request: NextRequest) {
  try {
    const { jobTitle, jobDescription, questions, candidateName } = await request.json()

    const vapiApiKey = process.env.VAPI_API_KEY
    if (!vapiApiKey) {
      return NextResponse.json({ error: 'Vapi API key not configured' }, { status: 500 })
    }

    const vapi = createVapiClient(vapiApiKey)

    const assistant = createInterviewAssistant(
      jobTitle,
      jobDescription,
      questions,
      candidateName
    )

    const result = await vapi.createAssistant(assistant)

    return NextResponse.json({ assistantId: result.id })
  } catch (error) {
    console.error('Error creating Vapi assistant:', error)
    return NextResponse.json(
      { error: 'Failed to create assistant' },
      { status: 500 }
    )
  }
}