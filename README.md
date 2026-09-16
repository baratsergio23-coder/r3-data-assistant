# R3 bLU cRU — Technical Data Assistant

A small web app: your boss (or anyone with the link) can ask questions in plain
English/Spanish and get answers grounded in the championship's real timing
data (2021–2026). The Anthropic API key stays on the server — it is never
sent to the browser.

## What's in this folder
- `server.js` — the backend. Serves the page and calls the Anthropic API.
- `public/index.html` — the chat page.
- `public/logo.png` — the logo shown in the header.
- `dataset.json` — the full dataset (lap times, speeds, rider rankings, the
  2027 simulation, etc.) that grounds every answer.

## Fastest way to get a shareable link (free, ~5 minutes): Render

1. Create a free account at https://render.com (you can sign in with GitHub).
2. Put this folder in a GitHub repo (or use Render's "Upload" option if you
   don't want to use GitHub — see "No GitHub" below).
3. In Render: **New → Web Service**, connect the repo.
4. Settings:
   - Build command: `npm install`
   - Start command: `npm start`
5. Under **Environment**, add a variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key (from https://console.anthropic.com)
6. Click **Create Web Service**. Render gives you a URL like
   `https://r3-data-assistant.onrender.com` — send that to your boss.

The free tier sleeps after inactivity and takes ~30s to wake up on the first
request after a while; that's normal and fine for this use case.

### No GitHub? 
Render, Railway and Fly.io all also let you deploy by connecting a repo only
— the simplest no-GitHub path is Railway's CLI (`railway up` from this
folder) or asking a developer colleague to push this folder to a repo for
you once. Any standard Node hosting works the same way; the two settings
that matter everywhere are the start command (`npm start`) and the
`ANTHROPIC_API_KEY` environment variable.

## Running it on your own laptop first (recommended before deploying)

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
cd r3-data-assistant
npm install
export ANTHROPIC_API_KEY=sk-ant-...     # your key
npm start
```

Then open http://localhost:3000 in your browser.

(On Windows PowerShell, use `$env:ANTHROPIC_API_KEY="sk-ant-..."` instead of
`export`.)

## Updating the data later

If you re-run a season and want to refresh the numbers, replace
`dataset.json` with an updated export in the same shape and restart the
server — no code changes needed.

## Cost note

Each question costs a small amount of Anthropic API usage (this app uses
Claude Sonnet). For a team principal asking occasional questions, this is a
few cents at most per session — not a concern at normal usage levels, but
worth knowing if the link gets shared widely.
