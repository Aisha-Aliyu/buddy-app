const { test } = require("node:test");
const assert = require("node:assert/strict");
const { AttemptLimiter, clientIp } = require("../lib/limits");
const http = require("node:http");
const { lookupUser, AuthCheckError } = require("../lib/firebase-auth");

test("limiter blocks after the limit and resets", () => {
  const limiter = new AttemptLimiter(3, 60000);
  for (let i = 0; i < 3; i++) {
    assert.equal(limiter.blocked("a"), false);
    limiter.add("a");
  }
  assert.equal(limiter.blocked("a"), true);
  assert.equal(limiter.blocked("b"), false);
  limiter.reset("a");
  assert.equal(limiter.blocked("a"), false);
});

test("limiter forgets attempts outside the window", () => {
  let clock = 1000;
  const limiter = new AttemptLimiter(1, 20, { now: () => clock });
  limiter.add("a");
  assert.equal(limiter.blocked("a"), true);
  clock += 20;
  assert.equal(limiter.blocked("a"), true);
  clock += 1;
  assert.equal(limiter.blocked("a"), false);
});

test("client IP can't be faked through X-Forwarded-For", () => {
  const req = (headers) => ({ headers, socket: { remoteAddress: "10.0.0.9" } });
  assert.equal(clientIp(req({ "cf-connecting-ip": "203.0.113.5", "x-forwarded-for": "1.2.3.4" })), "203.0.113.5");
  assert.equal(clientIp(req({ "x-forwarded-for": "1.2.3.4, 198.51.100.7" })), "198.51.100.7");
  assert.equal(clientIp(req({})), "10.0.0.9");
  // Only Cloudflare Enterprise sets True-Client-IP, so a visitor could send their own
  assert.equal(clientIp(req({ "true-client-ip": "6.6.6.6" })), "10.0.0.9");
  assert.equal(clientIp(req({ "x-forwarded-for": "1.2.3.4, 2001:db8:1:2345::7" })), "2001:0db8:0001:2300::/56");
});

test("IPv6 visitors are counted by their /56 network", () => {
  const ip = (address) => clientIp({ headers: { "cf-connecting-ip": address }, socket: {} });
  assert.equal(ip("2001:db8:1:2345::1"), "2001:0db8:0001:2300::/56");
  assert.equal(ip("2001:DB8:1:23ff:abcd::9"), "2001:0db8:0001:2300::/56");
  assert.notEqual(ip("2001:db8:1:2400::1"), ip("2001:db8:1:2345::1"));
  assert.equal(ip("::ffff:203.0.113.9"), "203.0.113.9");
  assert.equal(ip("203.0.113.9"), "203.0.113.9");
  assert.equal(clientIp({ headers: {}, socket: { remoteAddress: "::ffff:10.0.0.9" } }), "10.0.0.9");
});

test("a full limiter keeps its active counters and blocks anyone new", () => {
  const limiter = new AttemptLimiter(3, 60000, { maxKeys: 5 });
  for (let i = 0; i < 3; i++) limiter.add("target");
  for (let i = 0; i < 10; i++) limiter.add(`flood-${i}`);
  assert.equal(limiter.hits.size, 5);
  assert.equal(limiter.blocked("target"), true);
  assert.equal(limiter.blocked("flood-0"), false);
  assert.equal(limiter.blocked("someone-new"), true);
});

test("a full per-address limiter lets newcomers through and keeps its counters", () => {
  const limiter = new AttemptLimiter(3, 60000, { maxKeys: 5, whenFull: "allow" });
  for (let i = 0; i < 3; i++) limiter.add("target");
  for (let i = 0; i < 10; i++) limiter.add(`flood-${i}`);
  assert.equal(limiter.hits.size, 5);
  assert.equal(limiter.blocked("target"), true);
  assert.equal(limiter.blocked("someone-new"), false);
  limiter.add("someone-new");
  assert.equal(limiter.hits.size, 5);
  assert.throws(() => new AttemptLimiter(1, 1000, { whenFull: "maybe" }));
});

test("adding to a full limiter clears out expired counters on its own", () => {
  for (const whenFull of ["block", "allow"]) {
    let clock = 1000;
    const limiter = new AttemptLimiter(1, 100, { maxKeys: 1, whenFull, now: () => clock });
    limiter.add("a");
    clock = 1200;
    limiter.add("b");
    assert.equal(limiter.hits.has("a"), false, whenFull);
    assert.equal(limiter.count("b"), 1, whenFull);
  }
});

test("a full limiter makes room by dropping only expired counters", () => {
  let clock = 1000;
  const limiter = new AttemptLimiter(2, 60000, { maxKeys: 2, now: () => clock });
  limiter.add("old");
  clock += 30000;
  limiter.add("recent");
  clock += 30001;
  assert.equal(limiter.blocked("new"), false);
  limiter.add("new");
  assert.equal(limiter.hits.has("old"), false);
  assert.equal(limiter.hits.has("recent"), true);
  assert.equal(limiter.count("new"), 1);
});

test("a limiter keeps only the newest `limit` attempts per visitor", () => {
  let clock = 1000;
  const limiter = new AttemptLimiter(3, 100, { now: () => clock });
  for (let i = 0; i < 5; i++) {
    limiter.add("busy");
    clock += 10;
  }
  assert.equal(limiter.hits.get("busy").length, 3);
  // The newest three were made at 1020, 1030 and 1040, so the block lasts until 1120
  clock = 1115;
  assert.equal(limiter.blocked("busy"), true);
  clock = 1121;
  assert.equal(limiter.blocked("busy"), false);
});

test("a full limiter looks for expired counters at most every 10 seconds", () => {
  let clock = 1000;
  const limiter = new AttemptLimiter(1, 1000, { maxKeys: 1, now: () => clock });
  limiter.add("a");
  assert.equal(limiter.blocked("b"), true);
  clock = 3000; // "a" has expired, but the last look was only 2 seconds ago
  assert.equal(limiter.blocked("b"), true);
  clock = 11001;
  assert.equal(limiter.blocked("b"), false);
});

// A stand-in for Firebase's accounts:lookup endpoint
async function fakeFirebase(handler) {
  const seen = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const request = { url: req.url, body: JSON.parse(body || "{}") };
      seen.push(request);
      const [status, payload] = handler(request);
      res.writeHead(status, { "Content-Type": "application/json" });
      // A string is sent as it is, to imitate an answer that isn't valid JSON
      res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { url: `http://127.0.0.1:${server.address().port}/lookup`, seen, close: () => server.close() };
}

const firebaseError = (message) => [400, { error: { code: 400, message } }];

test("a valid Firebase token gives back who it belongs to", async () => {
  const firebase = await fakeFirebase(() => [200, { users: [{ localId: "u1", email: "ada@example.com", displayName: "Ada" }] }]);
  try {
    const user = await lookupUser("aaa.bbb.ccc", { apiKey: "web key", url: firebase.url });
    assert.deepEqual(user, { uid: "u1", email: "ada@example.com", name: "Ada" });
    assert.equal(firebase.seen[0].url, "/lookup?key=web%20key");
    assert.deepEqual(firebase.seen[0].body, { idToken: "aaa.bbb.ccc" });
  } finally {
    firebase.close();
  }
});

test("bad, expired or deleted-account tokens are refused", async () => {
  const answers = {
    "bad.token.x": firebaseError("INVALID_ID_TOKEN"),
    "old.token.x": firebaseError("TOKEN_EXPIRED : The user's credential is no longer valid."),
    "gone.token.x": firebaseError("USER_NOT_FOUND"),
    "banned.token.x": firebaseError("USER_DISABLED"),
    "off.token.x": [200, { users: [{ localId: "u2", disabled: true }] }],
    "none.token.x": [200, {}],
  };
  const firebase = await fakeFirebase((request) => answers[request.body.idToken]);
  try {
    for (const token of Object.keys(answers)) {
      assert.equal(await lookupUser(token, { apiKey: "k", url: firebase.url }), null, token);
    }
    // Things that can't be a Firebase token aren't sent to Firebase at all
    for (const token of [undefined, 42, "no-dots", "a.b", "x".repeat(5000) + ".y.z"]) {
      assert.equal(await lookupUser(token, { apiKey: "k", url: firebase.url }), null);
    }
    assert.equal(firebase.seen.length, Object.keys(answers).length);
  } finally {
    firebase.close();
  }
});

test("Firebase being down or a wrong API key is an error, not a refusal", async () => {
  const answers = {
    "key.problem.x": firebaseError("API key not valid. Please pass a valid API key."),
    "garbled.ok.x": [200, "{not json"],
    "garbled.error.x": [400, "<html>Bad Request</html>"],
  };
  const firebase = await fakeFirebase((request) => answers[request.body.idToken] || [500, {}]);
  try {
    await assert.rejects(lookupUser("key.problem.x", { apiKey: "k", url: firebase.url }), AuthCheckError);
    await assert.rejects(lookupUser("server.error.x", { apiKey: "k", url: firebase.url }), AuthCheckError);
    // A success Firebase can't be read from is a failed check, not a signed-out user
    await assert.rejects(lookupUser("garbled.ok.x", { apiKey: "k", url: firebase.url }), AuthCheckError);
    await assert.rejects(lookupUser("garbled.error.x", { apiKey: "k", url: firebase.url }), AuthCheckError);
  } finally {
    firebase.close();
  }
  // Nothing listening any more: the connection itself fails
  await assert.rejects(lookupUser("a.b.c", { apiKey: "k", url: firebase.url }), AuthCheckError);
});
