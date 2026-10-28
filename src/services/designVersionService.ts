import { uiText } from "../i18n/uiText";
import {
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { tenantCollection } from "../firebase/firestore";
import type { Design } from "../types";
export async function saveDesignVersion(id: string, design: Design) {
  if (!id) throw new Error(uiText("ui.4e38c6b6f2b8"));
  await addDoc(tenantCollection("invitations", id, "versions"), {
    design,
    createdAt: serverTimestamp(),
  });
}
export async function listDesignVersions(id: string) {
  const rows = await getDocs(
    query(
      tenantCollection("invitations", id, "versions"),
      orderBy("createdAt", "desc"),
      limit(30),
    ),
  );
  return rows.docs.map((d) => ({ id: d.id, ...d.data() })) as {
    id: string;
    design: Design;
    createdAt: { toDate: () => Date };
  }[];
}
