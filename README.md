# Buddy AI

A mental health companion web app with mood tracking, a private journal, guided breathing, calming games and a place to keep emergency contacts. I built it as my final year project at Maryam Abacha American University of Nigeria (MAAUN), and it was graded A+.

Live demo: https://buddy-app-six.vercel.app

## Why I built it

Getting mental health support in Nigeria is hard, and asking for it still carries a stigma. I wanted a private space anyone could open on their phone at any time, without booking an appointment.

## Features

- Sign up and sign in, then land on a dashboard that greets you and shows a daily affirmation.
- Mood tracking: log how you feel each day and see your mood history on a Chart.js graph.
- VentSpace, a private journal where you can write, edit, delete and search entries.
- Chat with Buddy, which replies based on the mood it picks up from your message.
- Guided meditation and breathing exercises.
- Mindful games for when you need a short break.
- Affirmations and inspiration matched to your mood.
- Up to three emergency contacts, with a simulated alert.
- Profile settings for your name, bio, photo, email and password.
- Light and dark mode, saved in localStorage.
- Installable on a phone as a PWA.

## How it's built

The frontend is HTML, CSS and vanilla JavaScript, with one page per screen and shared `css` and `js` folders. Data is stored in the browser with localStorage, and there's a small Node.js and Express backend in the `backend` folder. It's deployed on Vercel.

## Run it locally

```bash
git clone https://github.com/Aisha-Aliyu/buddy-app.git
cd buddy-app
npx http-server . -p 3000
```

Then open http://localhost:3000/homepage.html.

To run the backend as well:

```bash
cd backend
npm install
npm start
```

## Final year project

- B.Sc. Software Engineering, MAAUN
- Grade: A+ (4.0 out of 4.0)
- Built with an Agile process over five sprints
- Supervisor: Mrs. Sanah Abdullahi Mu'azu
- Usability testing with students gave an average satisfaction score of 4.7 out of 5

## What I'd add next

A real database for user data, real AI replies through an API, reminders for the daily check-in, a service worker for full offline use, real SMS or call alerts for emergency contacts, and a React Native version.

## Contact

Aisha Aliyu, full stack and frontend engineer

- Portfolio: https://humairah.netlify.app
- LinkedIn: https://www.linkedin.com/in/aisha-aliyu-dev
- GitHub: https://github.com/Aisha-Aliyu

License: MIT
