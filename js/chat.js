function goBack() {
window.location.href = "homepage.html";
}

const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");

// Add typing indicator element
const typingIndicator = document.createElement("div");
typingIndicator.className = "message bot typing-indicator";
typingIndicator.innerHTML = `
  <div class="typing-dots">
    <span></span><span></span><span></span>
  </div>
`;
typingIndicator.style.display = "none";
chatBox.appendChild(typingIndicator);

userInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

// Mood and name
const mood = localStorage.getItem("selectedMood") || "Neutral";
const name = localStorage.getItem("userName") || "User";

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

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  appendBubble(text, "user");
  userInput.value = "";
  userInput.style.height = "auto";

  typingIndicator.style.display = "block";
  chatBox.scrollTop = chatBox.scrollHeight;

  const fullPrompt = `You are Buddy, a helpful mental health assistant. 
The user is feeling ${mood}. ${moodPrompt[mood] || ""}. 
Their message: "${text}"`;

  try {
    const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userMessage: text, mood })
});
    const data = await response.json();
    const botReply = data.choices[0].message.content;
    typingIndicator.style.display = "none";
    appendBubble(botReply, "bot");
  } catch (err) {
    typingIndicator.style.display = "none";
    appendBubble("Oops! I couldn't connect to Buddy right now.", "bot");
  }
}

function appendBubble(message, type) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${type}`;
  bubble.textContent = message;
  chatBox.insertBefore(bubble, typingIndicator);
  chatBox.scrollTop = chatBox.scrollHeight;
}

