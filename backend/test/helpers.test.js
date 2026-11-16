const { test } = require("node:test");
const assert = require("node:assert/strict");
const { AttemptLimiter, clientIp } = require("../lib/limits");
const { cleanEmail, normalizeEmail, cleanName } = require("../lib/validate");

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

test("limiter forgets attempts outside the window", async () => {
  const limiter = new AttemptLimiter(1, 20);
  limiter.add("a");
  assert.equal(limiter.blocked("a"), true);
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(limiter.blocked("a"), false);
});

test("client IP can't be faked through X-Forwarded-For", () => {
  const req = (headers) => ({ headers, socket: { remoteAddress: "10.0.0.9" } });
  assert.equal(clientIp(req({ "cf-connecting-ip": "203.0.113.5", "x-forwarded-for": "1.2.3.4" })), "203.0.113.5");
  assert.equal(clientIp(req({ "x-forwarded-for": "1.2.3.4, 198.51.100.7" })), "198.51.100.7");
  assert.equal(clientIp(req({})), "10.0.0.9");
  // Only Cloudflare Enterprise sets True-Client-IP, so a visitor could send their own
  assert.equal(clientIp(req({ "true-client-ip": "6.6.6.6" })), "10.0.0.9");
});

test("sign-in accepts any address an older account might have used", () => {
  assert.equal(normalizeEmail("  Old.User@LocalHost "), "old.user@localhost");
  assert.equal(normalizeEmail("no-at-sign"), null);
  assert.equal(normalizeEmail(""), null);
  assert.equal(normalizeEmail(7), null);
});

test("emails are trimmed, lowercased and must be a single bare address", () => {
  assert.equal(cleanEmail("  Aisha@Example.COM "), "aisha@example.com");
  for (const bad of ["", "no-at-sign", "a@b", "Boss <boss@example.com>", "a@example.com,b@example.com", 42, null]) {
    assert.equal(cleanEmail(bad), null, String(bad));
  }
});

test("names are trimmed and limited", () => {
  assert.equal(cleanName("  Aisha   Aliyu "), "Aisha Aliyu");
  assert.equal(cleanName("   "), null);
  assert.equal(cleanName("x".repeat(81)), null);
  assert.equal(cleanName({}), null);
});

test("a full limiter keeps its active counters instead of starting over", () => {
  const limiter = new AttemptLimiter(3, 60000, 5);
  for (let i = 0; i < 3; i++) limiter.add("target");
  for (let i = 0; i < 10; i++) limiter.add(`flood-${i}`);
  assert.equal(limiter.blocked("target"), true);
  assert.ok(limiter.hits.size <= 5);
});

test("a full limiter makes room by dropping only expired counters", async () => {
  const limiter = new AttemptLimiter(1, 20, 2);
  limiter.add("old-1");
  limiter.add("old-2");
  await new Promise((resolve) => setTimeout(resolve, 40));
  limiter.add("new");
  assert.equal(limiter.blocked("new"), true);
  assert.equal(limiter.hits.has("old-1"), false);
});

test("a limiter keeps at most `limit` attempts per visitor", () => {
  const limiter = new AttemptLimiter(3, 60000);
  for (let i = 0; i < 100; i++) limiter.add("busy");
  assert.equal(limiter.hits.get("busy").length, 3);
  assert.equal(limiter.blocked("busy"), true);
});
