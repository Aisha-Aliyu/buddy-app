const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

// These tests need the installed packages. Locally they skip until npm install has run;
// on CI nothing is skipped.
let app, missing = false;
try {
  app = require("../app");
} catch (err) {
  // Only one of the app's own packages not being installed yet skips these tests. Any
  // other error, like a broken file or a misspelled module name, fails them.
  const { dependencies = {} } = require("../package.json");
  const name = /Cannot find module '([^']+)'/.exec(err.message)?.[1];
  const missingPackage = err.code === "MODULE_NOT_FOUND" && Object.hasOwn(dependencies, name ?? "");
  if (process.env.CI || !missingPackage) throw err;
  missing = `packages not installed (${err.message.split("\n")[0]})`;
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

// A stand-in for OpenRouter or Firebase: handler gets the request and returns [status, json]
function fakeService(handler) {
  return http.createServer((req, res) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      const [status, payload] = handler({ url: req.url, headers: req.headers, body: data ? JSON.parse(data) : {} });
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(payload));
    });
  });
}

test("the chat's limiters let newcomers through when full", { skip: missing }, () => {
  const { chatRequestsByIp, chatRequestsByUser } = require("../routes/chat").limiters;
  // Blocking newcomers in a full limiter would let a flood close the chat for everyone
  assert.equal(chatRequestsByIp.whenFull, "allow");
  assert.equal(chatRequestsByUser.whenFull, "allow");
});

test("chat route", { skip: missing }, async () => {
  let aiCalls = 0;
  let lastAiRequest = null;
  let aiFails = false;
  const openRouter = fakeService((request) => {
    aiCalls++;
    lastAiRequest = request;
    return aiFails ? [500, { error: "down" }] : [200, { choices: [{ message: { content: " Hello from the test " } }] }];
  });

  // Tokens shaped "good.<uid>.sig" belong to <uid>; Firebase refuses anything else
  let firebaseDown = false;
  const lookups = [];
  const firebase = fakeService((request) => {
    lookups.push(request);
    if (firebaseDown) return [503, {}];
    const [kind, uid] = String(request.body.idToken).split(".");
    if (kind === "good") return [200, { users: [{ localId: uid, email: `${uid}@example.com` }] }];
    return [400, { error: { code: 400, message: "INVALID_ID_TOKEN" } }];
  });

  process.env.OPENROUTER_URL = await listen(openRouter);
  process.env.FIREBASE_AUTH_URL = `${await listen(firebase)}/lookup`;
  process.env.OPENROUTER_KEY = "test-key";
  process.env.FIREBASE_API_KEY = "firebase-web-key";
  delete process.env.OPENROUTER_MODEL;
  require("../routes/chat").resetLimits();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const chat = (userMessage, headers, extra = {}) => call(base, "/api/chat", { body: { userMessage, ...extra }, headers });
  const as = (uid, ip = "203.0.113.10") => ({ "CF-Connecting-IP": ip, Authorization: `Bearer good.${uid}.sig` });

  try {
    const health = await call(base, "/api/health", { method: "GET" });
    assert.equal(health.status, 200);
    assert.deepEqual(health.body, { status: "ok" });

    // A signed-in message reaches the AI with the right prompt
    const ok = await chat("I had a rough day", as("ada"), { mood: "Sad" });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.reply, "Hello from the test");
    assert.equal(lastAiRequest.headers.authorization, "Bearer test-key");
    assert.equal(lastAiRequest.body.model, "openrouter/free");
    assert.match(lastAiRequest.body.messages[0].content, /feel Sad/);
    assert.equal(lastAiRequest.body.messages[1].content, "I had a rough day");
    assert.equal(lookups.at(-1).url, "/lookup?key=firebase-web-key");
    assert.equal(lookups.at(-1).body.idToken, "good.ada.sig");

    // No token, or one Firebase refuses, never reaches the AI
    const callsBefore = aiCalls;
    const visitor = { "CF-Connecting-IP": "203.0.113.12" };
    const noToken = await chat("hello", visitor);
    assert.equal(noToken.status, 401);
    assert.match(noToken.body.reply, /sign in/i);
    assert.equal((await chat("hello", { ...visitor, Authorization: "Bearer bad.token.sig" })).status, 401);
    assert.equal((await chat("hello", { ...visitor, Authorization: "Basic abc" })).status, 401);
    assert.equal(aiCalls, callsBefore);

    // Firebase answering with an error, or not answering at all, is a 503, not a sign-out
    firebaseDown = true;
    assert.equal((await chat("hello", as("ada"))).status, 503);
    firebaseDown = false;
    const firebaseUrl = process.env.FIREBASE_AUTH_URL;
    const closed = http.createServer();
    process.env.FIREBASE_AUTH_URL = `${await listen(closed)}/lookup`;
    await new Promise((resolve) => closed.close(resolve));
    const unreachable = await chat("hello", as("ada"));
    assert.equal(unreachable.status, 503);
    assert.match(unreachable.body.reply, /can't check your sign-in/);
    process.env.FIREBASE_AUTH_URL = firebaseUrl;

    // Missing settings on the server give a clear 503
    delete process.env.FIREBASE_API_KEY;
    assert.equal((await chat("hello", as("ada"))).status, 503);
    process.env.FIREBASE_API_KEY = "firebase-web-key";
    delete process.env.OPENROUTER_KEY;
    assert.equal((await chat("hello", as("ada"))).status, 503);
    process.env.OPENROUTER_KEY = "test-key";

    assert.equal((await chat("   ", as("ada"))).status, 400);
    assert.equal((await chat("x".repeat(2001), as("ada"))).status, 400);

    aiFails = true;
    const aiDown = await chat("hello", as("ada"));
    assert.equal(aiDown.status, 502);
    assert.match(aiDown.body.reply, /couldn't reach the AI service/);
    aiFails = false;

    // 30 messages per account per 10 minutes, even when the address changes
    for (let i = 0; i < 30; i++) assert.equal((await chat(`hi ${i}`, as("busy", `198.51.100.${i}`))).status, 200);
    assert.equal((await chat("one more", as("busy", "198.51.100.99"))).status, 429);

    // And 30 per address, even across accounts
    for (let i = 0; i < 30; i++) assert.equal((await chat(`hi ${i}`, as(`user${i}`, "203.0.113.50"))).status, 200);
    assert.equal((await chat("one more", as("fresh", "203.0.113.50"))).status, 429);

    assert.equal((await call(base, "/api/chat", { raw: "{not json" })).status, 400);
    assert.equal((await call(base, "/api/chat", { body: { userMessage: "x".repeat(30000) } })).status, 413);
  } finally {
    server.close();
    openRouter.close();
    firebase.close();
  }
});
