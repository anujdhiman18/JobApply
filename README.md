# JobPilot

A minimal full-stack automated job application assistant built with React, Express.js, and MongoDB.

## Structure

- `server/` — Express.js API, Mongoose models (`User`, `Resume`, `Preferences`, `Job`, `Application`), PDF ATS scorer, mock job matcher, and `node-cron` daily scheduler.
- `client/` — Vite + React minimal UI (`Login`, `Dashboard`, `Upload Resume`, `Preferences`, `Pending Approvals`, `Application History`).

## Run Locally

1. Ensure MongoDB is running locally (`mongodb://127.0.0.1:27017/jobpilot`).
2. Start backend:
   ```bash
   cd server
   npm install
   npm run dev
   ```
3. Start frontend:
   ```bash
   cd client
   npm install
   npm run dev
   ```
4. Open `http://localhost:5173`.

