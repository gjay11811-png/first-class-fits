const ALLOWED_HOSTS = [
  "firstclassfits.co",
  "www.firstclassfits.co",
  "firstclassfits.lovable.app",
];
const ALLOWED_SUFFIXES = [".lovable.app"];

export function isAllowedReturnUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (ALLOWED_HOSTS.includes(u.hostname)) return true;
    return ALLOWED_SUFFIXES.some((s) => u.hostname.endsWith(s));
  } catch {
    return false;
  }
}
