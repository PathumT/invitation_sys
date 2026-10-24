import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  MoreHorizontal,
  Pencil,
  Eye,
  Share2,
  Users,
  Trash2,
} from "lucide-react";
import type { Invitation } from "../../types";
export function InvitationActions({
  event,
  onShare,
  onDelete,
}: {
  event: Invitation;
  onShare: (event: Invitation) => void;
  onDelete: (event: Invitation) => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        ref.current.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  function dismiss() {
    if (ref.current) ref.current.open = false;
  }
  return (
    <details
      className="invitation-action-menu"
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          dismiss();
          ref.current?.querySelector("summary")?.focus();
        }
      }}
    >
      <summary aria-label={`Actions for ${event.title}`}>
        <MoreHorizontal size={20} />
      </summary>
      <div className="invitation-menu-content">
        <Link to={`/invitations/${event.id}/edit`}>
          <Pencil size={15} />
          Edit invitation
        </Link>
        <Link to={`/invitations/${event.id}/preview`}>
          <Eye size={15} />
          Preview invitation
        </Link>
        <button
          onClick={() => {
            dismiss();
            onShare(event);
          }}
        >
          <Share2 size={15} />
          Share invitation
        </button>
        <Link to={`/invitations/${event.id}/guests`}>
          <Users size={15} />
          Manage guests
        </Link>
        <button
          className="danger-text"
          onClick={() => {
            dismiss();
            onDelete(event);
          }}
        >
          <Trash2 size={15} />
          Delete invitation
        </button>
      </div>
    </details>
  );
}
