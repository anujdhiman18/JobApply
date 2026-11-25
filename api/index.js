/**
 * api/index.js — Vercel Serverless entry point for the entire Express app.
 *
 * Vercel automatically serves any file inside the /api directory as a
 * serverless function.  All requests to /api/* are rewritten here via
 * vercel.json rewrites.
 *
 * We re-use the same Express app from server/ — no code duplication.
 */

// Load .env when running locally (Vercel injects env vars automatically)
require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });

module.exports = require('../server/server.js');
