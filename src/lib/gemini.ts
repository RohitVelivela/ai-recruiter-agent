import { GoogleGenerativeAI } from '@google/generative-ai'

export interface InterviewEvaluation {
  summary: string
  strengths: string[]
  weaknesses: string[]
  score: number
  recommendation: 'hire' | 'maybe' | 'no-hire'
  reasoning: string
}

export interface InterviewQuestionSet {
  role: string
  questions: string[]
  followUpQuestions: string[]
  evaluationCriteria: string[]
}

class GeminiAI {
  private genAI: GoogleGenerativeAI

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  async generateInterviewQuestions(
    jobTitle: string,
    jobDescription: string,
    requiredSkills: string[],
    experienceLevel: string
  ): Promise<InterviewQuestionSet> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `Generate a comprehensive set of interview questions for the following position:

Job Title: ${jobTitle}
Job Description: ${jobDescription}
Required Skills: ${requiredSkills.join(', ')}
Experience Level: ${experienceLevel}

Please provide:
1. 8-10 core interview questions that assess both technical skills and cultural fit
2. 3-5 follow-up questions for each core question
3. Key evaluation criteria for this role

Format the response as a JSON object with the following structure:
{
  "role": "${jobTitle}",
  "questions": ["question1", "question2", ...],
  "followUpQuestions": ["followup1", "followup2", ...],
  "evaluationCriteria": ["criteria1", "criteria2", ...]
}

Focus on:
- Technical competency relevant to the role
- Problem-solving abilities
- Communication skills
- Cultural fit
- Leadership potential (if applicable)
- Relevant experience and achievements

Make questions conversational and avoid yes/no questions.`

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // Fallback if JSON parsing fails
      throw new Error('Failed to parse AI response')
    } catch (error) {
      console.error('Error generating interview questions:', error)
      // Fallback questions
      return {
        role: jobTitle,
        questions: [
          "Tell me about yourself and your background.",
          "What interests you about this position and our company?",
          "Can you describe a challenging project you worked on recently?",
          "How do you handle working under pressure or tight deadlines?",
          "Where do you see yourself in 5 years?",
          "What are your greatest strengths and how do they apply to this role?",
          "Describe a time when you had to learn a new technology or skill quickly.",
          "How do you approach problem-solving in your work?"
        ],
        followUpQuestions: [
          "Can you give me a specific example?",
          "What was the outcome of that situation?",
          "How did you measure success in that project?",
          "What would you do differently if you faced that situation again?",
          "How did that experience change your approach?"
        ],
        evaluationCriteria: [
          "Technical knowledge and skills",
          "Communication and articulation",
          "Problem-solving approach",
          "Cultural fit and values alignment",
          "Experience relevance",
          "Growth mindset and learning ability"
        ]
      }
    }
  }

  async evaluateInterview(
    transcript: string,
    jobTitle: string,
    jobDescription: string,
    questionsAsked: string[],
    requiredSkills: string[]
  ): Promise<InterviewEvaluation> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `Please evaluate this interview transcript for the following position:

Job Title: ${jobTitle}
Job Description: ${jobDescription}
Required Skills: ${requiredSkills.join(', ')}
Questions Asked: ${questionsAsked.join(', ')}

Interview Transcript:
${transcript}

Please provide a comprehensive evaluation including:

1. A brief summary of the candidate's responses and overall performance
2. Key strengths demonstrated during the interview
3. Areas for improvement or weaknesses identified
4. A numerical score from 0-100 based on:
   - Technical competency (30%)
   - Communication skills (25%)
   - Cultural fit (20%)
   - Problem-solving ability (15%)
   - Experience relevance (10%)
5. A hiring recommendation: "hire", "maybe", or "no-hire"
6. Reasoning for the recommendation

Format the response as a JSON object:
{
  "summary": "Brief summary of candidate performance",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "score": 85,
  "recommendation": "hire",
  "reasoning": "Detailed reasoning for the recommendation"
}

Be objective, fair, and constructive in your evaluation.`

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      throw new Error('Failed to parse AI response')
    } catch (error) {
      console.error('Error evaluating interview:', error)
      // Fallback evaluation
      return {
        summary: "Unable to process interview evaluation automatically. Manual review required.",
        strengths: ["Interview completed"],
        weaknesses: ["Evaluation system error"],
        score: 50,
        recommendation: 'maybe',
        reasoning: "Technical error during evaluation. Please review manually."
      }
    }
  }

  async generateFollowUpQuestions(
    previousResponse: string,
    originalQuestion: string,
    jobContext: string
  ): Promise<string[]> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `Based on the candidate's response below, generate 2-3 relevant follow-up questions:

Original Question: ${originalQuestion}
Job Context: ${jobContext}
Candidate's Response: ${previousResponse}

The follow-up questions should:
- Dig deeper into specific aspects of their response
- Clarify any ambiguous points
- Explore practical applications
- Assess depth of knowledge

Return only the questions as a JSON array: ["question1", "question2", "question3"]`

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return ["Can you elaborate on that point?", "What was the outcome?"]
    } catch (error) {
      console.error('Error generating follow-up questions:', error)
      return ["Can you provide more details?", "How did that work out?"]
    }
  }
}

export const createGeminiClient = (apiKey: string) => new GeminiAI(apiKey)