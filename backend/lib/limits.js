// In-memory counters that slow down password guessing and protect the AI budget.
// They reset when the server restarts, which is enough for one small server.
class AttemptLimiter {
  constructor(limit, windowMs) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.hits = new Map();
    this.lastSweep = Date.now();
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
    if (this.hits.size > 10000 && now - this.lastSweep > 60000) {
      this.lastSweep = now;
      for (const stale of [...this.hits.keys()]) this.prune(stale, now);
      // Flooded with new keys: start over instead of growing without limit
      if (this.hits.size > 10000) this.hits.clear();
    }
    if (!this.hits.has(key)) this.hits.set(key, []);
    this.hits.get(key).push(now);
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
