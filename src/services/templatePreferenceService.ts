import { setDoc, serverTimestamp } from "firebase/firestore";
import { tenantDocument } from "../firebase/firestore";
export const favoriteTemplate = (id: string, favorite: boolean) =>
  setDoc(tenantDocument("templatePreferences", id), {
    favorite,
    updatedAt: serverTimestamp(),
  });
