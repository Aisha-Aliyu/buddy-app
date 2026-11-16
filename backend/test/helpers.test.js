const { test } = require("node:test");
const assert = require("node:assert/strict");
const { AttemptLimiter, clientIp } = require("../lib/limits");
const { cleanEmail, cleanName } = require("../lib/validate");

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
