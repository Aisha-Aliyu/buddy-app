const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

// These tests need the installed packages, and the account tests also need a MongoDB
// database (CI starts one and sets MONGODB_URI_TEST)
let app, mongoose, bcrypt, missing = false;
try {
  app = require("../app");
  mongoose = require("mongoose");
  bcrypt = require("bcryptjs");
} catch (err) {
  missing = `packages not installed (${err.code || err.message})`;
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${server.address().port}`)));
}

async function call(base, path, { method = "POST", body, headers = {}, raw } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test("chat route", { skip: missing }, async (t) => {
  let lastRequest = null;
  let fail = false;
  const fakeOpenRouter = http.createServer((req, res) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      lastRequest = { headers: req.headers, body: JSON.parse(data) };
      res.writeHead(fail ? 500 : 200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(fail ? { error: "down" } : { choices: [{ message: { content: " Hello from the test " } }] }));
    });
  });
  process.env.OPENROUTER_URL = await listen(fakeOpenRouter);
  process.env.OPENROUTER_KEY = "test-key";
  delete process.env.OPENROUTER_MODEL;
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const visitor = { "CF-Connecting-IP": "203.0.113.10" };

  try {
    const health = await call(base, "/api/health", { method: "GET" });
    assert.equal(health.status, 200);
    assert.equal(health.body.status, "ok");

    const ok = await call(base, "/api/chat", { body: { userMessage: "I had a rough day", mood: "Sad" }, headers: visitor });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.reply, "Hello from the test");
    assert.equal(lastRequest.headers.authorization, "Bearer test-key");
    assert.equal(lastRequest.body.model, "openrouter/free");
    assert.match(lastRequest.body.messages[0].content, /feel Sad/);
    assert.equal(lastRequest.body.messages[1].content, "I had a rough day");

    assert.equal((await call(base, "/api/chat", { body: { userMessage: "   " }, headers: visitor })).status, 400);
    assert.equal((await call(base, "/api/chat", { body: { userMessage: "x".repeat(2001) }, headers: visitor })).status, 400);

    fail = true;
    const down = await call(base, "/api/chat", { body: { userMessage: "hello" }, headers: visitor });
    assert.equal(down.status, 502);
    assert.match(down.body.reply, /couldn't reach the AI service/);
    fail = false;

    delete process.env.OPENROUTER_KEY;
    const noKey = await call(base, "/api/chat", { body: { userMessage: "hello" }, headers: visitor });
    assert.equal(noKey.status, 503);
    process.env.OPENROUTER_KEY = "test-key";

    // 30 messages per visitor per 10 minutes
    const busy = { "CF-Connecting-IP": "203.0.113.11" };
    for (let i = 0; i < 30; i++) {
      assert.equal((await call(base, "/api/chat", { body: { userMessage: `hi ${i}` }, headers: busy })).status, 200);
    }
    assert.equal((await call(base, "/api/chat", { body: { userMessage: "one more" }, headers: busy })).status, 429);

    const badJson = await call(base, "/api/chat", { raw: "{not json" });
    assert.equal(badJson.status, 400);
    const tooBig = await call(base, "/api/chat", { body: { userMessage: "x".repeat(30000) } });
    assert.equal(tooBig.status, 413);
  } finally {
    server.close();
    fakeOpenRouter.close();
  }
});

test("sign-up and sign-in against a real database", {
  skip: missing || (!process.env.MONGODB_URI_TEST && "MONGODB_URI_TEST is not set"),
}, async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST);
  await mongoose.connection.dropDatabase();
  const User = require("../models/user");
  await User.init();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const me = { "CF-Connecting-IP": "198.51.100.20" };

  try {
    const health = await call(base, "/api/health", { method: "GET" });
    assert.equal(health.body.database, "ok");

    assert.equal((await call(base, "/api/signup", { body: { fullname: "Ada", email: "ada@example.com", password: "short" }, headers: me })).status, 400);
    assert.equal((await call(base, "/api/signup", { body: { fullname: "Ada", email: "not-an-email", password: "long enough" }, headers: me })).status, 400);
    assert.equal((await call(base, "/api/signup", { body: { fullname: " ", email: "ada@example.com", password: "long enough" }, headers: me })).status, 400);

    const created = await call(base, "/api/signup", { body: { fullname: "Ada Lovelace", email: "Ada@Example.com", password: "long enough" }, headers: me });
    assert.equal(created.status, 201);
    assert.equal(created.body.name, "Ada Lovelace");
    assert.equal((await User.findOne({ fullname: "Ada Lovelace" })).email, "ada@example.com");

    const duplicate = await call(base, "/api/signup", { body: { fullname: "Ada", email: "ADA@example.com", password: "long enough" }, headers: me });
    assert.equal(duplicate.status, 409);

    const wrong = await call(base, "/api/signin", { body: { email: "ada@example.com", password: "wrong password" }, headers: me });
    assert.equal(wrong.status, 401);
    const signedIn = await call(base, "/api/signin", { body: { email: "ADA@example.COM", password: "long enough" }, headers: me });
    assert.equal(signedIn.status, 200);
    assert.equal(signedIn.body.name, "Ada Lovelace");

    // Accounts made before this change kept the email exactly as typed, and some used
    // addresses the new sign-up check would refuse
    await User.create({ fullname: "Old Account", email: "Legacy@Example.com", passwordHash: await bcrypt.hash("old password", 10) });
    const legacy = await call(base, "/api/signin", { body: { email: "legacy@example.com", password: "old password" }, headers: me });
    assert.equal(legacy.status, 200);
    assert.equal(legacy.body.name, "Old Account");
    await User.create({ fullname: "Local Account", email: "Someone@LocalHost", passwordHash: await bcrypt.hash("old password", 10) });
    const local = await call(base, "/api/signin", { body: { email: "someone@localhost", password: "old password" }, headers: me });
    assert.equal(local.status, 200);
    const nobody = await call(base, "/api/signin", { body: { email: "nobody@example.com", password: "not a real password" }, headers: me });
    assert.equal(nobody.status, 401);

    // Eight wrong passwords lock that visitor out of the account, but not its owner
    const attacker = { "CF-Connecting-IP": "203.0.113.66" };
    for (let i = 0; i < 8; i++) {
      assert.equal((await call(base, "/api/signin", { body: { email: "ada@example.com", password: "guess guess" }, headers: attacker })).status, 401);
    }
    assert.equal((await call(base, "/api/signin", { body: { email: "ada@example.com", password: "long enough" }, headers: attacker })).status, 429);
    const owner = { "CF-Connecting-IP": "198.51.100.21" };
    assert.equal((await call(base, "/api/signin", { body: { email: "ada@example.com", password: "long enough" }, headers: owner })).status, 200);

    // Guessing spread over many addresses: past 50 wrong passwords in an hour, each new
    // address gets one guess, while the owner can still sign in
    await User.create({ fullname: "Grace", email: "grace@example.com", passwordHash: await bcrypt.hash("right password", 10) });
    const guess = (n) => call(base, "/api/signin", { body: { email: "grace@example.com", password: "guess" }, headers: { "CF-Connecting-IP": `203.0.113.${n}` } });
    // Six addresses use up their eight guesses each (48), a seventh adds two (50)
    for (let n = 100; n < 106; n++) {
      for (let i = 0; i < 8; i++) assert.equal((await guess(n)).status, 401);
    }
    assert.equal((await guess(106)).status, 401);
    assert.equal((await guess(106)).status, 401);
    assert.equal((await guess(106)).status, 429);
    const fresh = { "CF-Connecting-IP": "203.0.113.200" };
    assert.equal((await call(base, "/api/signin", { body: { email: "grace@example.com", password: "guess" }, headers: fresh })).status, 401);
    assert.equal((await call(base, "/api/signin", { body: { email: "grace@example.com", password: "guess" }, headers: fresh })).status, 429);
    const grace = { "CF-Connecting-IP": "198.51.100.30" };
    assert.equal((await call(base, "/api/signin", { body: { email: "grace@example.com", password: "right password" }, headers: grace })).status, 200);
  } finally {
    server.close();
    await mongoose.disconnect();
  }
});
