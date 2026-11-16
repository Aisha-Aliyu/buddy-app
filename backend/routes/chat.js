// backend/routes/chat.js
const express = require("express");
const { AttemptLimiter, clientIp } = require("../lib/limits");
const router = express.Router();

const MAX_MESSAGE_LENGTH = 2000;
// Every reply uses the AI service, so one visitor gets 30 messages per 10 minutes. If the
// limiter ever fills up, newcomers get through rather than chat closing for everyone.
const chatRequestsByIp = new AttemptLimiter(30, 10 * 60 * 1000, { whenFull: "allow" });
// OpenRouter's free router picks whichever free model is available, so the chat keeps
// working without credits. OPENROUTER_MODEL can name a specific model instead.
const DEFAULT_MODEL = "openrouter/free";

const moodPrompt = {
  Happy: "Respond in a cheerful, bright tone",
  Sad: "Respond softly and supportively",
  Angry: "Calm them down with kindness",
  Anxious: "Give reassuring advice",
  Joyful: "Join in their joy!",
  Unhappy: "Be empathetic and uplifting",
  Neutral: "Use a friendly and neutral tone",
  Tired: "Respond gently and calmly",
  Excited: "Match their energy and hype them up!",
  Lost: "Offer guidance and encouragement",
  Calm: "Maintain a peaceful, soothing tone",
  Exhausted: "Remind them it’s okay to rest"
};

const AI_UNAVAILABLE = "Buddy couldn't reach the AI service just now. Please try again in a moment.";

router.limiters = { chatRequestsByIp };
router.resetLimits = () => chatRequestsByIp.reset();

router.post("/", async (req, res) => {
  const userMessage = typeof req.body?.userMessage === "string" ? req.body.userMessage.trim() : "";
  const mood = Object.hasOwn(moodPrompt, req.body?.mood) ? req.body.mood : "Neutral";

  if (!userMessage) return res.status(400).json({ reply: "Please type a message first." });
  if (userMessage.length > MAX_MESSAGE_LENGTH)
    return res.status(400).json({ reply: `That message is a bit long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.` });

  const ip = clientIp(req);
  if (chatRequestsByIp.blocked(ip))
    return res.status(429).json({ reply: "You've sent a lot of messages in a short time. Please take a short break and try again in a few minutes." });
  chatRequestsByIp.add(ip);

  const openRouterKey = (process.env.OPENROUTER_KEY || "").trim();
  if (!openRouterKey) {
    console.error("OPENROUTER_KEY not set in environment");
    return res.status(503).json({ reply: "Buddy can't chat right now because the AI service isn't set up on the server." });
  }

  const systemPrompt = [
    "You are Buddy, a warm and supportive mental health companion in a wellness app.",
    `The user says they feel ${mood}. ${moodPrompt[mood]}.`,
    "Keep replies short, kind and practical. You are not a therapist and you don't diagnose.",
    "If the user mentions self-harm, suicide, abuse or being in danger, respond with care and urge them to contact local emergency services, a crisis line or someone they trust right away.",
  ].join(" ");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    // Node 18+ has fetch built in. The old require("node-fetch") broke because version 3
    // of that package can't be loaded with require.
    const response = await fetch(process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://buddy-app-six.vercel.app",
        "X-Title": "Buddy"
      },
      body: JSON.stringify({
        model: (process.env.OPENROUTER_MODEL || "").trim() || DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        max_tokens: 1000
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenRouter error:", response.status, text.slice(0, 300));
      return res.status(502).json({ reply: AI_UNAVAILABLE });
    }

    const data = await response.json();
    const botReply = data?.choices?.[0]?.message?.content?.trim();
    return res.status(200).json({ reply: botReply || "Sorry, I didn't catch that. Could you say it another way?" });
  } catch (err) {
    console.error("Chat route error:", err.message);
    return res.status(502).json({ reply: AI_UNAVAILABLE });
  } finally {
    clearTimeout(timer);
  }
});

module.exports = router;
