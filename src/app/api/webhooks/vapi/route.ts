import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const { type, data } = payload

    console.log('Received Vapi webhook:', type, data)

    const supabase = createClient()

    // Handle different webhook events
    switch (type) {
      case 'call-started':
        await handleCallStarted(data, supabase)
        break

      case 'call-ended':
        await handleCallEnded(data, supabase)
        break

      case 'transcript-update':
        await handleTranscriptUpdate(data, supabase)
        break

      case 'recording-available':
        await handleRecordingAvailable(data, supabase)
        break

      default:
        console.log('Unhandled webhook type:', type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing Vapi webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCallStarted(data: any, supabase: any) {
  try {
    const { callId, assistantId, customer } = data

    const { error } = await supabase
      .from('interviews')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('vapi_call_id', callId)

    if (error) {
      console.error('Error updating interview on call start:', error)
    }
  } catch (error) {
    console.error('Error handling call started:', error)
  }
}

async function handleCallEnded(data: any, supabase: any) {
  try {
    const {
      callId,
      duration,
      transcript,
      recordingUrl,
      summary,
      endReason
    } = data

    // Find the interview by Vapi call ID
    const { data: interview, error: findError } = await supabase
      .from('interviews')
      .select('*')
      .eq('vapi_call_id', callId)
      .single()

    if (findError || !interview) {
      console.error('Interview not found for call ID:', callId)
      return
    }

    // Update interview with call results
    const updateData: any = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration_minutes: duration ? Math.ceil(duration / 60) : null,
    }

    if (transcript) {
      updateData.transcript = transcript
    }

    if (recordingUrl) {
      updateData.audio_url = recordingUrl
    }

    const { error: updateError } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', interview.id)

    if (updateError) {
      console.error('Error updating interview on call end:', updateError)
      return
    }

    // Update application status
    const { error: appUpdateError } = await supabase
      .from('applications')
      .update({ status: 'interviewed' })
      .eq('id', interview.application_id)

    if (appUpdateError) {
      console.error('Error updating application status:', appUpdateError)
    }

    console.log('Successfully processed call end for interview:', interview.id)
  } catch (error) {
    console.error('Error handling call ended:', error)
  }
}

async function handleTranscriptUpdate(data: any, supabase: any) {
  try {
    const { callId, transcript } = data

    const { error } = await supabase
      .from('interviews')
      .update({
        transcript: transcript,
      })
      .eq('vapi_call_id', callId)

    if (error) {
      console.error('Error updating transcript:', error)
    }
  } catch (error) {
    console.error('Error handling transcript update:', error)
  }
}

async function handleRecordingAvailable(data: any, supabase: any) {
  try {
    const { callId, recordingUrl } = data

    const { error } = await supabase
      .from('interviews')
      .update({
        audio_url: recordingUrl,
      })
      .eq('vapi_call_id', callId)

    if (error) {
      console.error('Error updating recording URL:', error)
    }
  } catch (error) {
    console.error('Error handling recording available:', error)
  }
}