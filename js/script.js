// Backend base URL
const API_URL = "https://buddy-app-xi0a.onrender.com";

// The backend is on Render's free plan, which puts it to sleep when nobody has used it
// for a while, and waking it takes up to a minute. Every page pings it as soon as it
// opens, so by the time someone signs in it is usually awake.
function wakeServer() {
  fetch(`${API_URL}/api/health`, { cache: "no-store" }).catch(() => {});
}
wakeServer();

// Splash screen transition
function goToNextScreen() {
  document.querySelector('.splash-container').style.opacity = 0;
  setTimeout(() => {
    window.location.href = 'welcome.html';
  }, 800);
}

// Get Started → Signup
document.addEventListener("DOMContentLoaded", function () {
  const getStartedBtn = document.querySelector(".get-started-btn");
  if (getStartedBtn) {
    getStartedBtn.addEventListener("click", function () {
      window.location.href = "signup.html";
    });
  }

  // Personalized greeting
  const userName = localStorage.getItem("userName") || " User";
  const greetingName = document.getElementById("userGreetingName");
  const modalName = document.getElementById("userNameModal");

  if (greetingName) greetingName.textContent = userName;
  if (modalName) modalName.textContent = userName;

  // Mood Modal logic
  const chooseMoodBtn = document.querySelector(".mode-btn");
  const moodModal = document.getElementById("moodModal");
  const mainContent = document.body;

  if (chooseMoodBtn && moodModal && mainContent) {
    chooseMoodBtn.addEventListener("click", () => {
      moodModal.classList.add("show");
      mainContent.classList.add("dimmed");
    });

    const moodMessages = {
      Happy: `Yay, ${userName}! Keep shining bright today 🌞`,
      Exhausted: `Hey ${userName}, take it easy today. You’ve done enough 💆‍♀️`,
      Angry: `Let it out, ${userName}. I’m here to listen 💢`,
      Lost: `It’s okay to feel lost sometimes, ${userName}. Let’s find our way back 🌱`,
      Joyful: `That’s amazing, ${userName}! Spread the joy 🥰`,
      Calm: `Ahh... I love this calm energy, ${userName} 🌊`,
      Tired: `You deserve rest, ${userName}. Let’s take a breather 💤`,
      Unhappy: `I’m here for you, ${userName}. Let’s talk it out 🫂`,
      Sad: `Sending you virtual hugs, ${userName} 🤗`,
      Neutral: `Feeling balanced is good too, ${userName} ⚖️`,
      Anxious: `Hey ${userName}, let’s take a deep breath together 🧘🏽‍♀️`,
      Excited: `Let’s channel that energy into something awesome, ${userName} 🎉`
    };

    document.querySelectorAll(".mood-item").forEach(item => {
      item.addEventListener("click", () => {
        document.querySelectorAll(".mood-item").forEach(i => {
          i.classList.remove("selected");
          i.classList.add("unselected");
        });

        item.classList.add("selected");
        item.classList.remove("unselected");

        const mood = item.getAttribute("data-mood");
        localStorage.setItem("selectedMood", mood);
        const checkins = JSON.parse(localStorage.getItem("checkins")) || [];
        checkins.push({ mood, date: new Date().toISOString() });
        localStorage.setItem("checkins", JSON.stringify(checkins));

        const displayName = localStorage.getItem("userName") || "User";
        const msg = moodMessages[mood].replace(/User/g, displayName);

        showToast(msg);

        moodModal.classList.remove("show");
        mainContent.classList.remove("dimmed");
      });
    });
  }
});

// --- Sign-up and sign-in ---
const AUTH_TIMEOUT_MS = 90000;
const AUTH_RETRY_WINDOW_MS = 60000;
const WAKING_NOTICE_MS = 3500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Sends the form to the backend. While Render wakes the server, the request can fail
// before reaching it, so those failures are retried for a while.
async function postToBackend(path, body) {
  const giveUpAt = Date.now() + AUTH_RETRY_WINDOW_MS;
  for (let attempt = 1; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
    let response;
    let data;
    try {
      response = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      // The timeout also covers reading the answer, which can stall on its own
      data = await response.json().catch((error) => {
        if (error.name === "AbortError") throw error;
        return {};
      });
    } catch (error) {
      if (error.name !== "AbortError" && Date.now() < giveUpAt) {
        await sleep(Math.min(2000 * attempt, 8000));
        continue;
      }
      return { ok: false, status: 0, data: {} };
    } finally {
      clearTimeout(timer);
    }
    // Render answers with its own error page while it is still starting the server
    if (!data.message && [502, 503, 504].includes(response.status) && Date.now() < giveUpAt) {
      await sleep(Math.min(2000 * attempt, 8000));
      continue;
    }
    return { ok: response.ok, status: response.status, data, retried: attempt > 1 };
  }
}

function setFormStatus(form, message, kind = "") {
  const status = form.querySelector(".form-status");
  if (!status) return showToast(message);
  status.textContent = message;
  status.className = "form-status" + (kind ? ` ${kind}` : "");
}

async function submitAuthForm(form, path, body, busyText, onSuccess) {
  const button = form.querySelector('button[type="submit"]');
  const buttonText = button.textContent;
  button.disabled = true;
  button.textContent = busyText;
  setFormStatus(form, "");
  const wakingNotice = setTimeout(() => {
    setFormStatus(form, "Waking up the server. The first sign-in after a quiet spell can take up to a minute.");
  }, WAKING_NOTICE_MS);

  const result = await postToBackend(path, body);
  clearTimeout(wakingNotice);
  button.disabled = false;
  button.textContent = buttonText;

  // If the first sign-up attempt reached the server but its answer was lost, the retry
  // finds the account already there. That account is almost certainly this one.
  if (path === "/api/signup" && result.status === 409 && result.retried) return onSuccess({});
  if (result.ok) return onSuccess(result.data);
  if (result.status === 0) {
    return setFormStatus(form, "Can't reach the server right now. Please check your connection and try again.", "error");
  }
  setFormStatus(form, result.data.message || "Something went wrong. Please try again.", "error");
}

// Sign-Up
document.getElementById("signup-form")?.addEventListener("submit", async function (e) {
  e.preventDefault();
  const form = e.currentTarget;
  const name = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (password.length < 8) {
    return setFormStatus(form, "Your password needs at least 8 characters.", "error");
  }

  await submitAuthForm(form, "/api/signup", { fullname: name, email, password }, "Creating account...", (data) => {
    localStorage.setItem("userName", data.name || name);
    setFormStatus(form, "Account created. Taking you to sign in...", "success");
    setTimeout(() => { window.location.href = "signin.html"; }, 900);
  });
});

// Sign-In
document.getElementById("login-form")?.addEventListener("submit", async function (e) {
  e.preventDefault();
  const form = e.currentTarget;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  await submitAuthForm(form, "/api/signin", { email, password }, "Signing in...", (data) => {
    if (data.name) localStorage.setItem("userName", data.name);
    window.location.href = "homepage.html";
  });
});

// Toast Function
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

// Page Navigation Shortcuts

function goToAffirmation() {
  window.location.href = "daily-affirmation.html";
}
function goTo(page) {
  window.location.href = page;
}

// --- Emergency contacts (contacts page only) ---
let contacts = JSON.parse(localStorage.getItem("contacts")) || [];

function displayContacts() {
  const list = document.getElementById("contactList");
  if (!list) return;
  list.innerHTML = "";

  contacts.forEach((c, index) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = `${c.name} - ${c.phone}`;
    const remove = document.createElement("button");
    remove.textContent = "❌";
    remove.addEventListener("click", () => removeContact(index));
    li.append(label, remove);
    list.appendChild(li);
  });
}

// Add new contact
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", e => {
    e.preventDefault();
    if (contacts.length >= 3) {
      alert("You can only add up to 3 contacts.");
      return;
    }

    const name = document.getElementById("contactName").value.trim();
    const phone = document.getElementById("contactPhone").value.trim();

    if (!name || !phone) return;

    contacts.push({ name, phone });
    localStorage.setItem("contacts", JSON.stringify(contacts));
    displayContacts();

    e.target.reset();
  });
}

// Remove contact
function removeContact(index) {
  contacts.splice(index, 1);
  localStorage.setItem("contacts", JSON.stringify(contacts));
  displayContacts();
}

// Distress alert simulation
function sendDistressAlert() {
  if (contacts.length === 0) {
    alert("No emergency contacts set!");
    return;
  }

  contacts.forEach(c => {
    alert(`🚨 Distress Alert sent to ${c.name} at ${c.phone}`);
  });
}

// Dark mode toggle. Kept in its own block: a global `toggle` here clashed with the
// mood-tracking page's own script, which then failed and never drew the mood chart.
{
  const toggle = document.getElementById("darkModeToggle");
  if (toggle) {
    toggle.addEventListener("change", () => {
      document.body.classList.toggle("dark", toggle.checked);
    });
  }
}

// Initial display
displayContacts();
