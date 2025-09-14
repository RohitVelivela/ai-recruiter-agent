export interface VapiCall {
  id: string
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended'
  type: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall'
  transcript?: string
  recordingUrl?: string
  summary?: string
  startedAt?: string
  endedAt?: string
}

export interface VapiAssistant {
  model: {
    provider: 'openai'
    model: 'gpt-4' | 'gpt-3.5-turbo'
    temperature: number
    systemMessage: string
  }
  voice: {
    provider: 'openai' | 'elevenlabs'
    voiceId: string
  }
  firstMessage: string
  recordingEnabled: boolean
  hipaaEnabled?: boolean
  silenceTimeoutSeconds?: number
  responseDelaySeconds?: number
}

class VapiClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseUrl = 'https://api.vapi.ai'
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Vapi API error: ${response.statusText}`)
    }

    return response.json()
  }

  async createAssistant(assistant: VapiAssistant): Promise<{ id: string }> {
    return this.request<{ id: string }>('/assistant', {
      method: 'POST',
      body: JSON.stringify(assistant),
    })
  }

  async startCall(assistantId: string, customerNumber?: string): Promise<VapiCall> {
    return this.request<VapiCall>('/call', {
      method: 'POST',
      body: JSON.stringify({
        assistantId,
        customer: customerNumber ? { number: customerNumber } : undefined,
        type: customerNumber ? 'outboundPhoneCall' : 'webCall',
      }),
    })
  }

  async getCall(callId: string): Promise<VapiCall> {
    return this.request<VapiCall>(`/call/${callId}`)
  }

  async endCall(callId: string): Promise<void> {
    await this.request(`/call/${callId}`, {
      method: 'DELETE',
    })
  }

  async getCalls(): Promise<VapiCall[]> {
    return this.request<VapiCall[]>('/call')
  }

  generateWebCallScript(assistantId: string, publicKey: string): string {
    return `
      <script>
        const vapiPublicKey = '${publicKey}';
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
      </script>
      <script src="https://cdn.vapi.ai/web-sdk.js"></script>
    `
  }
}

export const createVapiClient = (apiKey: string) => new VapiClient(apiKey)

export const createInterviewAssistant = (
  jobTitle: string,
  jobDescription: string,
  questions: string[],
  candidateName: string
): VapiAssistant => ({
  model: {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    systemMessage: `You are an AI recruiter conducting a voice interview for the position of ${jobTitle}.

Candidate Information:
- Name: ${candidateName}
- Position: ${jobTitle}

Job Description: ${jobDescription}

Interview Instructions:
1. Start by greeting the candidate warmly and introducing yourself as an AI recruiter
2. Briefly explain the interview process and expected duration (15-20 minutes)
3. Ask the following questions one by one, waiting for complete responses:
${questions.map((q, i) => `   ${i + 1}. ${q}`).join('\n')}
4. After each response, provide brief acknowledgment and ask follow-up questions if needed
5. Keep the conversation professional but friendly
6. At the end, thank the candidate and explain next steps

Guidelines:
- Listen actively and ask clarifying follow-up questions
- Maintain a conversational tone
- If the candidate seems nervous, be encouraging
- Keep track of time and pace accordingly
- End the interview gracefully after all questions are covered

Remember to be professional, empathetic, and thorough in your evaluation.`
  },
  voice: {
    provider: 'openai',
    voiceId: 'alloy'
  },
  firstMessage: `Hello ${candidateName}! I'm Sarah, an AI recruiter, and I'm excited to speak with you today about the ${jobTitle} position. This interview will take about 15-20 minutes, and I'll be asking you several questions about your experience and qualifications. Are you ready to get started?`,
  recordingEnabled: true,
  hipaaEnabled: false,
  silenceTimeoutSeconds: 30,
  responseDelaySeconds: 1
})