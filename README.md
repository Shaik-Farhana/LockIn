# LockIn

LockIn is a speaking-practice web app for building clearer communication through short daily sessions. Pick a topic, study a focused brief for five minutes, speak your answer, and track your progress over time.

## Features

- Daily topics with Easy, Medium, and Hard modes
- Interview, vocabulary, and random speaking prompts
- Five-minute study timer before speaking
- Speaking mode with recording-style interaction
- Progress tracking for streaks, sessions, and average score
- Responsive Vite + React interface

## Live Demo

https://lock-in-ten-zeta.vercel.app/

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Make sure the `session-audio` storage bucket exists.
4. Add these env vars locally and in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GROQ_API_KEY`
   - `OPENAI_API_KEY` for server-side transcription and analysis fallback

## Tech Stack

React, Vite, Tailwind CSS, and Vercel.
