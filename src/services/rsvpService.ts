import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
export async function respond(
  id: string,
  rsvpStatus: "accepted" | "declined",
  name: string,
  responseId = "current",
) {
  const respondentName = name.trim();
  if (!respondentName || respondentName.length > 160)
    throw new Error("Please enter your name (up to 160 characters).");
  return setDoc(doc(db, "publicInvitations", id, "response", responseId), {
    respondentName,
    rsvpStatus,
    attendeesCount: rsvpStatus === "accepted" ? 1 : 0,
    respondedAt: serverTimestamp(),
  });
}
