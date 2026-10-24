import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { shareUrl } from "../utils";
import { ensurePublicLink } from "../services/publicLinkService";
import { getDoc } from "firebase/firestore";
import { tenantDocument } from "../firebase/firestore";
import type { Invitation } from "../types";
import { GuestExperience, ownerPreviewData } from "./PublicInvitation";
export default function InvitationPreview() {
  const { id } = useParams();
  const [event, setEvent] = useState<Invitation | null>(null);
  const [error, setError] = useState("");
  const [publicId, setPublicId] = useState("");
  useEffect(() => {
    getDoc(tenantDocument("invitations", id!))
      .then(async (s) => {
        if (!s.exists()) throw new Error("Invitation not found.");
        const value = { ...s.data(), id: s.id } as Invitation;
        if (value.status === "published")
          setPublicId(new URL(shareUrl(await ensurePublicLink(value), value.hostName)).pathname);
        else setEvent(value);
      })
      .catch((e) => setError(e.message));
  }, [id]);
  if (publicId) return <Navigate replace to={publicId} />;
  if (error)
    return (
      <div className="full-state">
        <h1>{error}</h1>
        <Link to="/invitations">Return to invitations</Link>
      </div>
    );
  return event ? (
    <GuestExperience data={ownerPreviewData(event)} preview />
  ) : (
    <div className="full-state">Loading preview…</div>
  );
}
