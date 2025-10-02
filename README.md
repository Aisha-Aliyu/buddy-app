# Buddy — AI Mental Health Companion 💛

Live Demo: https://buddy-app-six.vercel.app 

---

## Overview

Buddy is a responsive, client-side mental health web app that helps users track their moods, vent safely, chat with an AI‐powered companion, set emergency contacts, and access wellness tools (meditations, inspirations, etc.).  

This project demonstrates frontend architecture, local persistence, charts, and PWA capabilities, making it a great portfolio piece for recruiters.

---

## 🌟 Features

- Authentication: Signup and login screens with password hashing logic (on server side or mocked).  
- Homepage & Dashboard: Personalized greeting (“Hello, ......”), and links to:  
  • Mood tracking  
  • Daily affirmation / inspirations  
  • Guided meditation  
  • Support community  
  • Mindful activities  
- Mood Tracking: Users log moods (via check-ins), and see graphs over time with Chart.js.  
- VentSpace: A journaling area to write, edit, delete, and search entries.  
- Chat with Buddy: AI‐like conversation UI (can be extended with real backend).  
- Contacts: Store up to 3 emergency contacts and trigger alert simulations.  
- Profile Section: Upload profile picture, inline edit name & bio, change email/password, dark mode toggle, and a “Danger Zone” to delete account.  
- Dark Mode & Theming: Toggle between light/dark modes; persisted via localStorage.  
- PWA Setup: Includes site.webmanifest and favicon assets for installable behavior.  
- Responsive Design: Optimized for mobile and desktop views.

---

## 🛠 Tech Stack & Tools

- HTML / CSS / JavaScript (vanilla)  
- Chart.js for mood-line graphs  
- LocalStorage for persistent client-side data  
- Manifest + Favicons for PWA support  
- Deployment: Vercel

---

## 📥 Setup & Run Locally

1. Fork or clone this repository:

```bash
git clone https://github.com/Aisha-Aliyu/buddy-app.git
cd buddy-app

2. (Optional) If you later add a Node/Express backend, initialize dependencies:
npm install

3. Start a local server (for static HTML/JS, you can use something like live-server or http-server):
npx http-server . -p 3000

4. Visit http://localhost:3000/homepage.html (or your entry file) in your browser.

⸻

🚀 Deployment (Done via Vercel)
 • The project is connected to GitHub and auto-deploys on pushes to main.
 • Vercel hosts the static frontend, which supports PWA installs through the manifest & service-worker (if you add one later).

⸻

✅ What to Extend Next
 • Backend / Database for real user data, chat logic, and auth.
 • Notifications / SMS API for real emergency alerts.
 • Serverless Functions to power AI chat or sync data.
 • Service Worker / Caching to make Buddy work offline.
 • Analytics / Logging to track user engagement.
