import { NextRequest, NextResponse } from 'next/server'
import { createVapiClient } from '@/lib/vapi'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { assistantId, interviewId } = await request.json()

    const vapiApiKey = process.env.VAPI_API_KEY
    if (!vapiApiKey) {
      return NextResponse.json({ error: 'Vapi API key not configured' }, { status: 500 })
    }

    const vapi = createVapiClient(vapiApiKey)
    const call = await vapi.startCall(assistantId)

    const supabase = createClient()

    const { error } = await supabase
      .from('interviews')
      .update({
        vapi_call_id: call.id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', interviewId)

    if (error) {
      console.error('Error updating interview:', error)
    }

    return NextResponse.json({
      callId: call.id,
      status: call.status
    })
  } catch (error) {
    console.error('Error starting Vapi call:', error)
    return NextResponse.json(
      { error: 'Failed to start call' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callId = searchParams.get('callId')

    if (!callId) {
      return NextResponse.json({ error: 'Call ID required' }, { status: 400 })
    }

    const vapiApiKey = process.env.VAPI_API_KEY
    if (!vapiApiKey) {
      return NextResponse.json({ error: 'Vapi API key not configured' }, { status: 500 })
    }

    const vapi = createVapiClient(vapiApiKey)
    const call = await vapi.getCall(callId)

    return NextResponse.json(call)
  } catch (error) {
    console.error('Error getting Vapi call:', error)
    return NextResponse.json(
      { error: 'Failed to get call' },
      { status: 500 }
    )
  }
}