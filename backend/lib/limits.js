// In-memory counters that slow down password guessing and protect the AI budget.
// They reset when the server restarts, which is enough for one small server.
class AttemptLimiter {
  constructor(limit, windowMs, maxKeys = 20000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
    this.hits = new Map();
    this.lastSweep = 0;
  }

  prune(key, now) {
    const attempts = this.hits.get(key);
    if (!attempts) return;
    while (attempts.length && now - attempts[0] > this.windowMs) attempts.shift();
    if (!attempts.length) this.hits.delete(key);
  }

  count(key) {
    this.prune(key, Date.now());
    return this.hits.get(key)?.length || 0;
  }

  blocked(key) {
    return this.count(key) >= this.limit;
  }

  add(key) {
    const now = Date.now();
    if (!this.hits.has(key)) {
      if (this.hits.size >= this.maxKeys) {
        // Make room by dropping expired counters only (at most every 10 seconds, so a
        // flood can't make every request scan the whole map). Active counters are never
        // thrown away, so flooding can't reset anyone's lockout.
        if (now - this.lastSweep > 10000) {
          this.lastSweep = now;
          for (const stale of [...this.hits.keys()]) this.prune(stale, now);
        }
        if (this.hits.size >= this.maxKeys) return;
      }
      this.hits.set(key, []);
    }
    const attempts = this.hits.get(key);
    attempts.push(now);
    // Blocking only needs the newest `limit` attempts, so older ones aren't kept
    if (attempts.length > this.limit) attempts.shift();
  }

  reset(key) {
    if (key === undefined) this.hits.clear();
    else this.hits.delete(key);
  }
}

// The visitor's IP address in a form they can't fake. Render serves apps through
// Cloudflare, which sets CF-Connecting-IP itself. The first X-Forwarded-For entry can be
// faked by the visitor; the last one was added by the proxy closest to the app.
function clientIp(req) {
  const fromCloudflare = String(req.headers["cf-connecting-ip"] || "").trim();
  if (fromCloudflare) return fromCloudflare;
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (forwarded.length) return forwarded[forwarded.length - 1];
  return req.socket?.remoteAddress || "unknown";
}

module.exports = { AttemptLimiter, clientIp };
