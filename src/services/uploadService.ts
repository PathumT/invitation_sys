import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/config";
import { tenantId } from "../firebase/firestore";
export async function uploadImage(file: File, eventId?: string) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size >= 5 * 1024 * 1024
  )
    throw new Error("Choose a PNG, JPG or WEBP image smaller than 5 MB.");
  const path = `tenants/${tenantId()}/${eventId ? `invitations/${eventId}` : "templates"}/${crypto.randomUUID()}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type });
  return { url: await getDownloadURL(r), path };
}
