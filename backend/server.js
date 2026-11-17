// backend/server.js
require("dotenv").config();
const app = require("./app");

// The chat needs both of these. Without them it still starts and answers with a clear
// "not set up" message, so the problem shows in the logs here.
for (const name of ["FIREBASE_API_KEY", "OPENROUTER_KEY"]) {
  if (!(process.env[name] || "").trim()) console.error(`${name} is not set, so the chat won't work`);
}

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
