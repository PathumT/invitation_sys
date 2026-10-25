import { uiText } from "../../i18n/uiText";
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
      <summary
        aria-label={uiText("ui.ef2e64783891", { value0: String(event.title) })}
      >
        <MoreHorizontal size={20} />
      </summary>
      <div className="invitation-menu-content">
        <Link to={`/invitations/${event.id}/edit`}>
          <Pencil size={15} />
          {uiText("ui.72207468a4de")}
        </Link>
        <Link to={`/invitations/${event.id}/preview`}>
          <Eye size={15} />
          {uiText("ui.c83ba6c7366e")}
        </Link>
        <button
          onClick={() => {
            dismiss();
            onShare(event);
          }}
        >
          <Share2 size={15} />
          {uiText("invitation.share")}
        </button>
        <Link to={`/invitations/${event.id}/guests`}>
          <Users size={15} />
          {uiText("ui.fea69dc79995")}
        </Link>
        <button
          className="danger-text"
          onClick={() => {
            dismiss();
            onDelete(event);
          }}
        >
          <Trash2 size={15} />
          {uiText("ui.6daff779d26e")}
        </button>
      </div>
    </details>
  );
}
