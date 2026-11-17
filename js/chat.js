// js/chat.js (frontend)
function goBack() {
  window.location.href = "homepage.html";
}

const API_URL = "https://buddy-app-xi0a.onrender.com"; // <- your Render backend URL
// Render's free server sleeps when idle; waking it now means the first reply comes faster
fetch(`${API_URL}/api/health`, { cache: "no-store" }).catch(() => {});
const CHAT_TIMEOUT_MS = 90000;

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

// js/firebase.js (a module) shares the signed-in user's ID token through window. It can
// load a moment after this script, so wait for it, but not forever: the 15 seconds cover
// loading, restoring the session and getting the token. Gives back the token, null when
// nobody is signed in, or undefined if sign-in couldn't load or took too long.
const SIGN_IN_WAIT_MS = 15000;
function signedInToken() {
  if (window.buddyAuthFailed) return Promise.resolve(undefined);
  const ready = window.buddyAuth
    ? Promise.resolve(window.buddyAuth)
    : new Promise((resolve) => {
        window.addEventListener("buddy-auth-ready", () => resolve(window.buddyAuth), { once: true });
        window.addEventListener("buddy-auth-failed", () => resolve(null), { once: true });
      });
  const token = ready.then((auth) => (auth ? auth.idToken() : undefined));
  const gaveUp = new Promise((resolve) => setTimeout(resolve, SIGN_IN_WAIT_MS, undefined));
  return Promise.race([token, gaveUp]);
}

// Firebase's codes for a session that has ended (password or email changed, account removed)
const SESSION_ENDED = ["auth/user-token-expired", "auth/user-disabled", "auth/user-not-found", "auth/invalid-user-token"];

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  appendBubble(text, "user");
  userInput.value = "";
  userInput.style.height = "auto";

  // The server only answers signed-in people, so the AI can't be used by anyone who finds it
  let token;
  try {
    token = await signedInToken();
  } catch (err) {
    console.error("Couldn't get the sign-in token:", err);
    if (SESSION_ENDED.includes(err?.code)) return appendSignInBubble("Your sign-in has expired. Please sign in again.");
    return appendBubble("I couldn't check that you're signed in. Please check your connection and try again.", "bot");
  }
  if (token === undefined) return appendBubble("Sign-in didn't load. Please check your connection and refresh the page.", "bot");
  if (!token) return appendSignInBubble("Please sign in first so we can chat.");

  typingIndicator.style.display = "block";
  chatBox.scrollTop = chatBox.scrollHeight;

  const fullPrompt = `You are Buddy, a helpful mental health assistant. 
The user is feeling ${mood}. ${moodPrompt[mood] || ""}. 
Their message: "${text}"`;

  // The first message after a quiet spell can take up to a minute while the server wakes
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);
  const slowNote = setTimeout(() => {
    appendBubble("Buddy is waking up. The first reply after a quiet spell can take up to a minute.", "bot");
  }, 6000);
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userMessage: text, mood }),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    const botReply = data.reply || "Oops! I couldn't connect to Buddy right now.";
    typingIndicator.style.display = "none";
    if (response.status === 401) appendSignInBubble(botReply);
    else appendBubble(botReply, "bot");
  } catch (err) {
    console.error("Chat fetch error:", err);
    typingIndicator.style.display = "none";
    appendBubble("Oops! I couldn't connect to Buddy right now. Please try again in a moment.", "bot");
  } finally {
    clearTimeout(timer);
    clearTimeout(slowNote);
  }
}

function appendBubble(message, type) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${type}`;
  bubble.textContent = message;
  chatBox.insertBefore(bubble, typingIndicator);
  chatBox.scrollTop = chatBox.scrollHeight;
  return bubble;
}

// A bot message with a link to the sign-in page after it
function appendSignInBubble(message) {
  const bubble = appendBubble(`${message} `, "bot");
  const link = document.createElement("a");
  link.href = "signin.html";
  link.textContent = "Sign in";
  bubble.append(link);
}