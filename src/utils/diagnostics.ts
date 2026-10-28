export interface BrowserDiagnostic {
  at: string;
  category: "module-load" | "permission" | "network" | "unexpected";
  path: string;
}
const entries: BrowserDiagnostic[] = [];
export function diagnosticPath(path: string) {
  const clean = path.split(/[?#]/)[0];
  if (/^\/i(?:\/|$)/.test(clean)) return "/i/[invitation]";
  const eventRoute = clean.match(
    /^\/invitations\/[^/]+\/(edit|preview|guests)\/?$/,
  );
  if (eventRoute) return `/invitations/[invitation]/${eventRoute[1]}`;
  return [
    "/",
    "/login",
    "/register",
    "/invitations",
    "/invitations/new",
    "/guests",
    "/templates",
    "/analytics",
    "/settings",
    "/plans",
    "/check-in",
    "/reminders",
  ].includes(clean)
    ? clean
    : "/[other]";
}
export function recordDiagnostic(
  error: unknown,
  path = typeof location !== "undefined" ? location.pathname : "",
) {
  const message = error instanceof Error ? error.message : String(error || "");
  const category = /dynamically imported|module script|loading chunk/i.test(
    message,
  )
    ? "module-load"
    : /permission|insufficient/i.test(message)
      ? "permission"
      : /network|fetch|offline/i.test(message)
        ? "network"
        : "unexpected";
  entries.push({
    at: new Date().toISOString(),
    category,
    path: diagnosticPath(path),
  });
  if (entries.length > 20) entries.shift();
}
export function browserDiagnostics() {
  return entries.map((entry) => ({ ...entry }));
}
export function installDiagnostics() {
  const onError = (event: ErrorEvent) => recordDiagnostic(event.error),
    onReject = (event: PromiseRejectionEvent) => recordDiagnostic(event.reason);
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onReject);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onReject);
  };
}
