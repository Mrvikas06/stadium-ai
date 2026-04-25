import { useState } from 'react';
import { askGemini } from '../lib/gemini';

const quickPrompts = [
  'Shortest food queue right now?',
  'Which gate has least crowd to exit?',
  'Where is first aid station?',
  'Best low-crowd route to North Stand?'
];

function detectInputLanguage(text, fallback = 'en') {
  const value = (text || '').trim().toLowerCase();
  if (!value) return fallback;

  // Script detection for Indian languages
  if (/[\u0B80-\u0BFF]/.test(value)) return 'ta'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(value)) return 'te'; // Telugu
  if (/[\u0C80-\u0CFF]/.test(value)) return 'kn'; // Kannada
  if (/[\u0D00-\u0D7F]/.test(value)) return 'ml'; // Malayalam
  if (/[\u0A80-\u0AFF]/.test(value)) return 'gu'; // Gujarati
  if (/[\u0A00-\u0A7F]/.test(value)) return 'pa'; // Punjabi (Gurmukhi)
  if (/[\u0B00-\u0B7F]/.test(value)) return 'or'; // Odia

  // Bengali/Assamese script share block
  if (/[\u0980-\u09FF]/.test(value)) {
    if (/(মই|আজি|ধন্যবাদ|কেনেকৈ|গেট|ভিৰ)/i.test(value)) return 'as';
    return 'bn';
  }

  // Devanagari shared by Hindi/Marathi
  if (/[\u0900-\u097F]/.test(value)) {
    if (/(आहे|कृपया|कुठे|मदत|धन्यवाद|रांग)/i.test(value)) return 'mr';
    return 'hi';
  }

  // Romanized hints (quick heuristic)
  if (/\b(kaise|kya|bheed|rasta|madad|stadium)\b/i.test(value)) return 'hi';
  if (/\b(kothay|dhonnobad|gate|line|berono)\b/i.test(value)) return 'bn';
  if (/\b(vanakkam|enga|vazhi|udhavi)\b/i.test(value)) return 'ta';
  if (/\b(namaskaram|ekkada|daari|sahayam)\b/i.test(value)) return 'te';
  if (/\b(namaskara|elli|daari|sahaya)\b/i.test(value)) return 'kn';
  if (/\b(namaskaram|evide|vazhi|sahayam)\b/i.test(value)) return 'ml';
  if (/\b(kasa|kuthe|madat|rang)\b/i.test(value)) return 'mr';
  if (/\b(kem|kyan|madad|line)\b/i.test(value)) return 'gu';
  if (/\b(kiwe|kithon|madad|line)\b/i.test(value)) return 'pa';
  if (/\b(kemiti|kouthi|sahajya|line)\b/i.test(value)) return 'or';
  if (/\b(kenekoi|kune|sahay|bheer)\b/i.test(value)) return 'as';

  return fallback;
}

export default function AssistantPanel({ t, lang }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Welcome. I can help with directions, queue times, exits, accessibility and safety.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (prompt) => {
    const text = (prompt ?? input).trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const detectedLang = detectInputLanguage(text, lang);
      const reply = await askGemini({
        userPrompt: text,
        languageCode: detectedLang,
        systemPrompt: `You are StadiumAI assistant.
Give concise and practical recommendations for crowd movement in a cricket stadium.
Prioritize safety, fast routes, and low-queue options.
Keep every reply short (max 2-4 lines) unless the user explicitly asks for details.
Use simple language and direct action points.
Always reply in the same language as the user's message.`
      });
      setMessages((prev) => [...prev, { role: 'bot', text: reply || 'No response received. Please try again.' }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'bot', text: error.message || 'Service unavailable.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card assistant" id="assistant">
      <div className="card-title">{t.chatTitle}</div>

      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={`${msg.role}-${idx}`} className={`bubble ${msg.role}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="bubble bot dim">{t.typing}</div>}
      </div>

      <div className="chat-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={t.chatPlaceholder}
        />
        <button onClick={() => sendMessage()} disabled={loading}>
          {t.send}
        </button>
      </div>

      <div className="server-note">Gemini is securely connected through the server.</div>

      <div className="quick-list">
        {quickPrompts.map((prompt) => (
          <button key={prompt} className="chip" onClick={() => sendMessage(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
    </section>
  );
}
