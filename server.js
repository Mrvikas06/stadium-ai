import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

app.use(express.json({ limit: '1mb' }));

app.post('/api/gemini', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    }

    const { userPrompt, systemPrompt, languageCode = 'en' } = req.body || {};
    if (!userPrompt || typeof userPrompt !== 'string') {
      return res.status(400).json({ error: 'userPrompt is required' });
    }

    const requestBody = {
      system_instruction: {
        parts: [{ text: `${systemPrompt || ''}\nReply in language code: ${languageCode}.` }]
      },
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 700
      },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
    };

    const candidateModels = [
      GEMINI_MODEL,
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.0-flash'
    ];

    let lastError = 'Gemini request failed';
    for (const model of candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const payload = await upstream.json().catch(() => ({}));
      if (upstream.ok) {
        const reply = payload?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return res.json({ reply, model });
      }

      lastError = payload?.error?.message || `Gemini request failed for model ${model}`;
      if (upstream.status !== 404) {
        break;
      }
    }

    return res.status(502).json({ error: lastError });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Unexpected server error' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`StadiumAI server running at http://localhost:${PORT}`);
});
