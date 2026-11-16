// backend/server.js
require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

// Connect to MongoDB. The server starts either way, so the health check and the error
// messages still work while the database is unreachable.
const uri = (process.env.MONGODB_URI || "").trim();
if (!uri) {
  console.error("MONGODB_URI is not set, so sign-up and sign-in won't work");
} else {
  mongoose
    .connect(uri)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err.message));
}
mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected"));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
