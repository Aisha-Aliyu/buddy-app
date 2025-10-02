// backend/api/chat.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { userMessage, mood } = req.body;

  if (!userMessage) return res.status(400).json({ message: "No message provided" });

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

  const fullPrompt = `You are Buddy, a helpful mental health assistant. 
The user is feeling ${mood}. ${moodPrompt[mood] || ""}. 
Their message: "${userMessage}"`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
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

    const data = await response.json();
    const botReply = data.choices?.[0]?.message?.content || "No response from Buddy.";
    res.status(200).json({ reply: botReply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Oops! I couldn't connect to Buddy right now." });
  }
}