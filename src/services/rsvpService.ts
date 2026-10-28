import { uiText } from "../i18n/uiText";
import type { RSVPAnswers } from "../types";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
export async function respond(
  id: string,
  rsvpStatus: "accepted" | "declined",
  name: string,
  responseId = "current",
  answers: RSVPAnswers = {},
) {
  const respondentName = name.trim();
  if (!respondentName || respondentName.length > 160)
    throw new Error(uiText("ui.a7b3b8ed3836"));
  return setDoc(doc(db, "publicInvitations", id, "response", responseId), {
    ...(Object.keys(answers).length ? { answers } : {}),
    respondentName,
    rsvpStatus,
    attendeesCount: rsvpStatus === "accepted" ? 1 : 0,
    respondedAt: serverTimestamp(),
  });
}
