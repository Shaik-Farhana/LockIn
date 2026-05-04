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

## Tech Stack

React, Vite, Tailwind CSS, and Vercel.

## Cloud Setup (Supabase + AI Review)

1. Create a Supabase project.
2. Run [schema.sql](/C:/Users/ADMIN/Downloads/LockIn%20-%20Improve%20Communication/LockIn-main/supabase/schema.sql) in Supabase SQL editor.
3. Create a Storage bucket named `session-audio` (or set `SUPABASE_STORAGE_BUCKET`).
4. Add environment variables from [.env.example](/C:/Users/ADMIN/Downloads/LockIn%20-%20Improve%20Communication/LockIn-main/.env.example) in Vercel project settings.
5. Redeploy your Vercel app.
