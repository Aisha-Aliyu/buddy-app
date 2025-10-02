// backend/routes/chat.js
const express = require("express");
const fetch = require("node-fetch"); // make sure node-fetch is in backend/package.json
const router = express.Router();

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

router.post("/", async (req, res) => {
  try {
    const { userMessage, mood } = req.body;
    if (!userMessage) return res.status(400).json({ message: "No message provided" });

    const fullPrompt = `You are Buddy, a helpful mental health assistant. 
The user is feeling ${mood || "Neutral"}. ${moodPrompt[mood] || ""}. 
Their message: "${userMessage}"`;

    const openRouterKey = process.env.OPENROUTER_KEY;
    if (!openRouterKey) {
      console.error("OPENROUTER_KEY not set in environment");
      return res.status(500).json({ reply: "Server misconfiguration: missing API key." });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: fullPrompt },
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenRouter error:", response.status, text);
      return res.status(502).json({ reply: "Failed to connect to the AI service." });
    }

    const data = await response.json();
    // Some providers return choices...message...content; we try to be defensive
    const botReply = data?.choices?.[0]?.message?.content || data?.reply || data?.result || "No response from Buddy.";
    return res.status(200).json({ reply: botReply });
  } catch (err) {
    console.error("Chat route error:", err);
    return res.status(500).json({ reply: "Oops! I couldn't connect to Buddy right now." });
  }
});

module.exports = router;