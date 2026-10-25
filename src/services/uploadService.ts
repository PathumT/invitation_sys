import { uiText } from "../i18n/uiText";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/config";
import { tenantId } from "../firebase/firestore";
export async function uploadImage(
  file: File,
  eventId?: string,
  compress = false,
) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size >= 5 * 1024 * 1024
  )
    throw new Error(uiText("ui.287d3cb2b6f3"));
  if (
    compress &&
    file.size > 500 * 1024 &&
    typeof createImageBitmap !== "undefined"
  ) {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
        canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
        const context = canvas.getContext("2d");
        if (context) {
          context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/webp", 0.85),
          );
          if (blob && blob.size < file.size)
            file = new File([blob], "event-photo.webp", { type: blob.type });
        }
      } finally {
        bitmap.close();
      }
    } catch {
      /* Keep the validated original when image optimization is unavailable. */
    }
  }
  const path = `tenants/${tenantId()}/${eventId ? `invitations/${eventId}` : "templates"}/${crypto.randomUUID()}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type });
  return { url: await getDownloadURL(r), path };
}

export async function uploadAudio(file: File, eventId: string) {
  if (!eventId) throw new Error(uiText("ui.30b2b0169428"));
  if (
    !["audio/mpeg", "audio/ogg", "audio/wav"].includes(file.type) ||
    file.size >= 10 * 1024 * 1024
  )
    throw new Error(uiText("ui.4730eacc3312"));
  const path = `tenants/${tenantId()}/invitations/${eventId}/audio-${crypto.randomUUID()}`;
  const target = ref(storage, path);
  await uploadBytes(target, file, { contentType: file.type });
  return getDownloadURL(target);
}
