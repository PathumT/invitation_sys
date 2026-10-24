import { lazy, type ComponentType } from "react";
const prefix = "evently-module-recovery:";
export function claimModuleRecovery(
  error: unknown,
  route: string,
  storage: Pick<Storage, "getItem" | "setItem">,
) {
  const message = error instanceof Error ? error.message : String(error);
  if (
    !/Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading (?:CSS )?chunk .+failed|Unable to preload CSS/i.test(
      message,
    )
  )
    return false;
  try {
    const key = prefix + route;
    if (storage.getItem(key)) return false;
    storage.setItem(key, "1");
    return true;
  } catch {
    return false;
  }
}
export function clearModuleRecovery(
  route: string,
  storage: Pick<Storage, "removeItem">,
) {
  try {
    storage.removeItem(prefix + route);
  } catch {
    /* Storage can be disabled. */
  }
}
export function lazyRoute<T extends ComponentType<any>>(
  load: () => Promise<{ default: T }>,
  route: string,
) {
  return lazy(async () => {
    try {
      const module = await load();
      try {
        clearModuleRecovery(route, window.sessionStorage);
      } catch {
        /* Keep normal navigation when storage is unavailable. */
      }
      return module;
    } catch (error) {
      try {
        if (
          navigator.onLine &&
          claimModuleRecovery(error, route, window.sessionStorage)
        ) {
          window.location.reload();
          return await new Promise<{ default: T }>(() => {});
        }
      } catch {
        /* Preserve the original error and the manual reload option. */
      }
      throw error;
    }
  });
}
