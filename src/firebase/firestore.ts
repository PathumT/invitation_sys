import { collection, doc } from "firebase/firestore";
import { auth, db } from "./config";
export function tenantId() {
  const u = auth.currentUser;
  if (!u || u.isAnonymous) throw new Error("Please sign in to your workspace.");
  return u.uid;
}
export const tenantCollection = (...path: string[]) =>
  collection(db, `tenants/${tenantId()}/${path.join("/")}`);
export const tenantDocument = (...path: string[]) =>
  doc(db, `tenants/${tenantId()}/${path.join("/")}`);
