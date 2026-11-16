const net = require("node:net");

// In-memory counters that slow down password guessing and protect the AI budget.
// They reset when the server restarts, which is enough for one small server.
class AttemptLimiter {
  // whenFull says what happens to someone new while the map is full: "block" counts them
  // as over the limit, "allow" lets them through uncounted. Each route picks the one
  // that suits what its limiter protects.
  constructor(limit, windowMs, { maxKeys = 20000, whenFull = "block", now = Date.now } = {}) {
    if (whenFull !== "block" && whenFull !== "allow") throw new Error(`Unknown whenFull: ${whenFull}`);
    this.limit = limit;
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
    this.whenFull = whenFull;
    this.now = now;
    this.hits = new Map();
    this.lastSweep = -Infinity;
  }

  prune(key, now) {
    const attempts = this.hits.get(key);
    if (!attempts) return;
    while (attempts.length && now - attempts[0] > this.windowMs) attempts.shift();
    if (!attempts.length) this.hits.delete(key);
  }

  // Whether there's room to track someone new. When the map is full, expired counters
  // are dropped to make room (at most every 10 seconds, so a flood can't make every
  // request scan the whole map). Active counters are never dropped.
  hasRoom(now) {
    if (this.hits.size < this.maxKeys) return true;
    if (now - this.lastSweep > 10000) {
      this.lastSweep = now;
      for (const key of [...this.hits.keys()]) this.prune(key, now);
    }
    return this.hits.size < this.maxKeys;
  }

  count(key) {
    const now = this.now();
    this.prune(key, now);
    const attempts = this.hits.get(key);
    if (attempts) return attempts.length;
    if (this.whenFull === "allow" || this.hasRoom(now)) return 0;
    return this.limit;
  }

  blocked(key) {
    return this.count(key) >= this.limit;
  }

  add(key) {
    const now = this.now();
    if (!this.hits.has(key)) {
      if (!this.hasRoom(now)) return;
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

// Writes an IPv6 address out as its eight 4-digit groups
function expandIPv6(ip) {
  let text = ip.toLowerCase();
  // A dotted IPv4 ending (like ::ffff:1.2.3.4) becomes two hex groups
  const v4 = /(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(text);
  if (v4) {
    const [a, b, c, d] = v4.slice(1).map(Number);
    text = `${text.slice(0, v4.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head, tail] = text.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const zeros = tail === undefined ? [] : Array(8 - left.length - right.length).fill("0");
  return [...left, ...zeros, ...right].map((group) => group.padStart(4, "0"));
}

// The key the limits count a visitor under. A home or server connection usually gets
// a whole block of IPv6 addresses, so IPv6 visitors are counted by their /56 network.
// Otherwise one person could switch to a fresh address for every request.
function limitKey(address) {
  const ip = String(address).trim().split("%")[0];
  if (!net.isIPv6(ip)) return ip;
  const groups = expandIPv6(ip);
  // An IPv4 address written as IPv6 (::ffff:1.2.3.4) counts as that IPv4 address
  if (groups.slice(0, 5).every((group) => group === "0000") && groups[5] === "ffff") {
    const high = parseInt(groups[6], 16);
    const low = parseInt(groups[7], 16);
    return [high >> 8, high & 255, low >> 8, low & 255].join(".");
  }
  return `${groups.slice(0, 3).join(":")}:${groups[3].slice(0, 2)}00::/56`;
}

// The visitor's IP address in a form they can't fake (IPv6 grouped as above). Render
// serves apps through Cloudflare, which sets CF-Connecting-IP itself. The first
// X-Forwarded-For entry can be faked by the visitor; the last one was added by the proxy
// closest to the app.
function clientIp(req) {
  const fromCloudflare = String(req.headers["cf-connecting-ip"] || "").trim();
  if (fromCloudflare) return limitKey(fromCloudflare);
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (forwarded.length) return limitKey(forwarded[forwarded.length - 1]);
  return limitKey(req.socket?.remoteAddress || "unknown");
}

module.exports = { AttemptLimiter, clientIp };
