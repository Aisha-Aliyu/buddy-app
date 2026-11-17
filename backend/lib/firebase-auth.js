// Checks a Firebase ID token by asking Firebase whose it is, through the Auth REST API's
// accounts:lookup. Firebase does the verifying, so no token or password code lives here.
const LOOKUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup";

// Firebase's answers for a token that's bad, expired or belongs to a deleted account
const REJECTED = new Set(["INVALID_ID_TOKEN", "TOKEN_EXPIRED", "USER_NOT_FOUND", "USER_DISABLED"]);

// Firebase couldn't be asked (down, slow, or the API key is wrong)
class AuthCheckError extends Error {}

// Gives back { uid, email, name } for a valid token, or null when the token isn't valid
async function lookupUser(idToken, { apiKey, url = process.env.FIREBASE_AUTH_URL || LOOKUP_URL } = {}) {
  // Firebase ID tokens are JWTs: three dot-separated parts, about a kilobyte long
  if (typeof idToken !== "string" || idToken.length > 4096 || idToken.split(".").length !== 3) return null;

  let response;
  try {
    response = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    throw new AuthCheckError(`Couldn't reach Firebase: ${err.message}`);
  }
  const data = await response.json().catch(() => ({}));

  if (response.ok) {
    const user = data.users?.[0];
    if (!user?.localId || user.disabled) return null;
    return { uid: user.localId, email: user.email || "", name: user.displayName || "" };
  }
  // Error messages look like "INVALID_ID_TOKEN" or "TOKEN_EXPIRED : more detail"
  const code = String(data.error?.message || "").split(" ")[0];
  if (response.status === 400 && REJECTED.has(code)) return null;
  throw new AuthCheckError(`Firebase answered ${response.status} ${code || "without a message"}`);
}

module.exports = { lookupUser, AuthCheckError };
