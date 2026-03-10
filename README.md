# 💛 Buddy AI — Mental Health Companion

> An AI-powered mental health web app with mood tracking, a safe venting space, guided meditation, mindful games, and emergency contacts — built as a Final Year Project earning an A+ grade.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-brightgreen?style=for-the-badge)](https://buddy-app-six.vercel.app/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)](https://buddy-app-six.vercel.app/)

-----

## 🌐 Live Demo

👉 **[buddy-app-six.vercel.app](https://buddy-app-six.vercel.app/)**

-----

## 📖 About

Buddy AI is a responsive, client-side mental health assistant designed to make emotional support accessible to anyone, anytime — no therapist appointment needed.

Built as a **Final Year Project at Maryam Abacha American University of Nigeria (MAAUN)**, it earned an **A+ grade (4.0/4.0)** and was developed using an Agile methodology across 5 sprints. The project addresses the critical shortage of mental health resources in Nigeria by providing a private, stigma-free digital space for emotional wellbeing.

-----

## ✨ Features

- 🔐 **Authentication** — Sign up / sign in with secure password handling
- 🏠 **Personalised Dashboard** — Greeting, daily affirmation, and quick access to all tools
- 😊 **Mood Tracking** — Log daily moods with visual indicators; view mood history over time with Chart.js graphs
- 📝 **VentSpace** — Private journaling area to write, edit, delete, and search entries
- 🤖 **Chat with Buddy** — AI-style conversational interface that responds based on detected emotional cues
- 🧘 **Guided Meditation** — Breathing exercises and calming techniques
- 🎮 **Mindful Games** — Stress-relieving interactive activities
- 🌟 **Daily Affirmations & Inspiration** — Mood-tailored motivational content
- 📞 **Emergency Contacts** — Store up to 3 emergency contacts with alert simulation
- 👤 **Profile Management** — Update name, bio, profile photo, email, and password
- 🌙 **Dark Mode** — Light/dark theme toggle, persisted via localStorage
- 📱 **PWA Support** — Installable on mobile via web manifest

-----

## 🛠️ Tech Stack

|Layer           |Technology                       |
|----------------|---------------------------------|
|Frontend        |HTML5, CSS3, JavaScript (ES6+)   |
|Charts          |Chart.js                         |
|Data Persistence|Browser localStorage             |
|Backend         |Node.js / Express (minimal)      |
|PWA             |Web App Manifest + Favicon assets|
|Deployment      |Vercel                           |

-----

## 📂 Project Structure

```
buddy-app/
├─ index.html          # Entry / landing page
├─ homepage.html       # Main dashboard
├─ chat.html           # AI chat interface
├─ moodtrack.html      # Mood tracking & history
├─ checkin.html        # Daily mood check-in
├─ vents.html          # VentSpace journaling
├─ meditation.html     # Guided meditation
├─ affirmation.html    # Daily affirmations
├─ inspiration.html    # Inspirational content
├─ games.html          # Mindful games
├─ contacts.html       # Emergency contacts
├─ support.html        # Support community
├─ profile.html        # User profile settings
├─ signin.html         # Sign in
├─ signup.html         # Sign up
├─ welcome.html        # Welcome screen
├─ css/                # Stylesheets
├─ js/                 # JavaScript modules
├─ assets/             # Images and icons
└─ backend/            # Server-side logic
```

-----

## ⚙️ Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Aisha-Aliyu/buddy-app.git
cd buddy-app
```

### 2. Run locally with a static server

```bash
npx http-server . -p 3000
```

Open <http://localhost:3000/homepage.html> in your browser.

### 3. (Optional) Run the backend

```bash
cd backend
npm install
npm start
```

-----

## 🚀 Deployment

Deployed on **Vercel** with automatic deployments from the `main` branch:

1. Push your code to GitHub
1. Import the repo into [Vercel](https://vercel.com/)
1. Deploy ✅ — static HTML/CSS/JS is served instantly

-----

## 🏆 Academic Context

This project was submitted as a **Final Year Project** for a B.Sc. in Software Engineering at MAAUN:

- **Grade:** A+ (4.0 / 4.0)
- **Methodology:** Agile (5 sprints)
- **Supervisor:** Mrs. Sanah Abdullahi Mu’azu
- **Usability Testing:** Average satisfaction score of **4.7 / 5.0** from student participants

-----

## 🗺️ Roadmap

- [ ] Real backend with MongoDB for persistent user data
- [ ] Real AI integration (OpenAI / Gemini API)
- [ ] Push notifications for daily check-in reminders
- [ ] Service worker for full offline support
- [ ] Real SMS/call integration for emergency contacts
- [ ] Mobile app version (React Native)

-----

## 👩‍💻 Author

**Aisha Aliyu** — Full-Stack & Frontend Engineer

- 🌐 Portfolio: [humairah.netlify.app](https://humairah.netlify.app)
- 💼 LinkedIn: [https://www.linkedin.com/in/aisha-aliyu-a9687b233](https://www.linkedin.com/in/aisha-aliyu-a9687b233)
- 🐙 GitHub: [@Aisha-Aliyu](https://github.com/Aisha-Aliyu)

-----

## 📜 License

This project is open source and available under the [MIT License](./LICENSE).