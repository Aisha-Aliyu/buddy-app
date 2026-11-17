// backend/app.js: the Express app, kept apart from server.js so tests can load it
const express = require("express");
const cors = require("cors");
const chatRoute = require("./routes/chat");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => res.json({ message: "Buddy API is running" }));

// Used by the frontend to wake the free server early
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Accounts live in Firebase, so the chat is the only route
app.use("/api/chat", chatRoute);

app.use((req, res) => res.status(404).json({ message: "Not found." }));

// Bad JSON and oversized bodies get a clear message instead of an HTML error page
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") return res.status(413).json({ message: "That request was too large." });
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "The request wasn't valid JSON." });
  console.error("Unexpected error:", err);
  return res.status(500).json({ message: "Something went wrong on the server. Please try again." });
});

module.exports = app;
