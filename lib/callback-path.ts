/** The page to return to after sign-in. Keeps only path and query, so it can never point at another site. */
export function callbackPath(value: unknown) {
  if (typeof value !== "string" || !value) return "/";
  try {
    const url = new URL(value, "http://local");
    return url.pathname === "/login" ? "/" : `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}
