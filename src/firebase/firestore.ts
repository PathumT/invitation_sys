import { uiText } from "../i18n/uiText";
import { collection, doc } from "firebase/firestore";
import { auth, db } from "./config";
export function tenantId() {
  const u = auth.currentUser;
  if (!u || u.isAnonymous) throw new Error(uiText("ui.6f3e1a834a42"));
  return u.uid;
}
export const tenantCollection = (...path: string[]) =>
  collection(db, `tenants/${tenantId()}/${path.join("/")}`);
export const tenantDocument = (...path: string[]) =>
  doc(db, `tenants/${tenantId()}${path.length ? `/${path.join("/")}` : ""}`);
