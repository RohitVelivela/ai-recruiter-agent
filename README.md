# AI Recruiter Voice Agent

A comprehensive AI-powered recruitment platform that conducts voice interviews, evaluates candidates automatically, and provides detailed insights to recruiters.

## Features

### For Candidates
- **Profile Creation**: Upload resumes, add skills, and complete professional profiles
- **Job Applications**: Browse and apply to available positions
- **AI Voice Interviews**: Take automated voice interviews powered by Vapi
- **Real-time Feedback**: Get evaluated by AI with detailed scoring and feedback

### For Recruiters
- **Dashboard**: Comprehensive view of candidates, interviews, and metrics
- **Job Management**: Create and manage job positions
- **AI Evaluation**: Automatic candidate assessment with scoring (0-100)
- **Interview Analytics**: View transcripts, audio recordings, and AI insights
- **Filtering & Search**: Advanced filtering by status, skills, scores, and more

### AI Features
- **Dynamic Questions**: AI generates role-specific interview questions using Gemini
- **Voice Interviews**: Natural voice conversations powered by Vapi
- **Automated Evaluation**: AI analyzes responses and provides detailed feedback
- **Transcript Analysis**: Extracts strengths, weaknesses, and recommendations

## Tech Stack

### Frontend & Backend
- **Next.js 15** - Full-stack React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework

### Database & Auth
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Row Level Security** - Secure data access control
- **File Storage** - Resume and audio file storage

### AI & Voice
- **Vapi** - AI voice conversation platform
- **Google Gemini** - AI for question generation and evaluation
- **Real-time Processing** - Webhook-based interview data processing

### Deployment
- **Vercel** - Serverless deployment platform
- **Edge Functions** - Fast API endpoints

## Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd ai-recruiter-agent
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Fill in your API keys and configuration:
- **Supabase**: Create a project at [supabase.com](https://supabase.com)
- **Vapi**: Get API keys from [vapi.ai](https://vapi.ai)
- **Gemini**: Get API key from [Google AI Studio](https://aistudio.google.com)

### 4. Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Set up storage buckets for resumes and audio files:
   ```sql
   -- Create storage buckets
   INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true);
   INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', true);
   ```

### 5. Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically with every push to main branch

### Environment Variables for Production
Set these in your Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPI_API_KEY`
- `NEXT_PUBLIC_VAPI_PUBLIC_KEY`
- `GEMINI_API_KEY`

### Webhooks Setup
Configure Vapi webhooks to point to your deployed URL:
```
https://your-domain.vercel.app/api/webhooks/vapi
```

## Database Schema

The application uses the following main tables:

- **profiles** - User authentication and roles
- **candidates** - Candidate information and resumes
- **job_positions** - Available job positions
- **applications** - Job applications by candidates
- **interviews** - Interview records with AI data
- **interview_feedback** - Recruiter feedback
- **ai_prompts** - AI-generated interview prompts

## API Routes

### Authentication
- `POST /api/auth/*` - Supabase authentication

### Vapi Integration
- `POST /api/vapi/assistant` - Create interview assistant
- `POST /api/vapi/call` - Start voice interview
- `GET /api/vapi/call` - Get call status
- `POST /api/webhooks/vapi` - Handle Vapi webhooks

### AI Features
- `POST /api/ai/questions` - Generate interview questions
- `POST /api/ai/evaluate` - Evaluate interview

## User Flows

### Candidate Flow
1. Sign up as a candidate
2. Complete profile with resume upload
3. Browse and apply to job positions
4. Take AI voice interview
5. Receive AI evaluation and feedback

### Recruiter Flow
1. Sign up as a recruiter
2. Create job positions
3. Review candidate applications
4. Access interview results and AI insights
5. Provide additional feedback and make hiring decisions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

Built with ❤️ using Next.js, Supabase, Vapi, and Google Gemini AI.