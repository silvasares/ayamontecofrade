<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Ayamonte Cofrade

Guía oficial de la Semana Santa de Ayamonte.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GROQ_API_KEY` in [.env.local](.env.local) to your Groq API key (free tier: https://console.groq.com/keys). Optionally set `GROQ_MODEL`.
3. Run the app:
   `npm run dev`
4. Check the AI integration:
   `npm run test:ai`

In production the key lives only in Vercel (Environment Variables → `GROQ_API_KEY`), never in the browser bundle.
