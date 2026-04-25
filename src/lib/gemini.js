export async function askGemini({ systemPrompt, userPrompt, languageCode = 'en' }) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt,
      userPrompt,
      languageCode
    })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || payload?.error?.message || 'Gemini request failed');
  }

  const data = await response.json();
  return data?.reply || '';
}
