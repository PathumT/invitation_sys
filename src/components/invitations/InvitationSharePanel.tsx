import { uiText } from "../../i18n/uiText";
import { useTranslation } from "react-i18next";
import { InvitationQRCode } from "./InvitationQRCode";
import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Share2,
  ExternalLink,
  MessageCircle,
  Link2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { Invitation } from "../../types";
import { ensurePublicLink } from "../../services/publicLinkService";
import { shareUrl, errorMessage } from "../../utils";

export function InvitationSharePanel({ event }: { event: Invitation }) {
  const { t } = useTranslation();
  const [qrOpen, setQrOpen] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [sharing, setSharing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const published = !!event.id && event.status === "published";
  useEffect(() => {
    let cancelled = false;
    setLink("");
    setError("");
    if (published)
      ensurePublicLink(event)
        .then((id) => {
          if (!cancelled) setLink(shareUrl(id, event.hostName));
        })
        .catch((e) => {
          if (!cancelled) setError(errorMessage(e));
        });
    return () => {
      cancelled = true;
    };
  }, [event.id, event.status, event.hostName, retry, published]);
  const message = `You’re invited to ${event.title}!\n${event.eventDate}${event.eventTime ? ` at ${event.eventTime}` : ""}\n${event.venueName}\n\nView the invitation and RSVP:\n${link}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(message)}`;
  let local = false;
  try {
    local = ["localhost", "127.0.0.1", "[::1]"].includes(
      new URL(link).hostname,
    );
  } catch {
    /* Link not generated yet. */
  }
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error(uiText("ui.4ff69f6f16e0"));
      await navigator.clipboard.writeText(link);
      toast.success(uiText("ui.4e453a08e12f"));
    } catch {
      input.current?.focus();
      input.current?.select();
      toast.info(uiText("ui.965e10ddecb5"));
    }
  }
  async function share() {
    if (!navigator.share) {
      window.open(whatsapp, "_blank", "noopener,noreferrer");
      return;
    }
    setSharing(true);
    try {
      await navigator.share({
        title: event.title,
        text: `You’re invited to ${event.title}. Open the invitation to accept or decline.`,
        url: link,
      });
    } catch (e) {
      if (!(e instanceof Error && e.name === "AbortError"))
        toast.error(uiText("ui.fbae29669515"));
    } finally {
      setSharing(false);
    }
  }
  return (
    <section
      className="invitation-share-panel"
      aria-label={uiText("ui.5fc19c12d3d2")}
    >
      <div className="invitation-share-heading">
        <span className="share-panel-icon">
          <Link2 size={20} />
        </span>
        <div>
          <h3>{uiText("ui.5fc19c12d3d2")}</h3>
          <p>{uiText("ui.c1c9640611d9")}</p>
        </div>
      </div>
      <label className="invitation-link-label">
        {uiText("ui.88c3be350635")}
        <input
          ref={input}
          type="text"
          readOnly
          value={link}
          placeholder={
            published
              ? error
                ? uiText("ui.091f33d8a8c2")
                : uiText("ui.288ca402972d")
              : uiText("ui.e6bf03bb1c49")
          }
          onFocus={(e) => e.target.select()}
        />
      </label>
      {error && (
        <div className="share-panel-error" role="alert">
          <p>{error}</p>
          <button
            className="button outline small"
            onClick={() => setRetry((n) => n + 1)}
          >
            <RefreshCw size={14} />
            {uiText("ui.7f5ff9117a29")}
          </button>
        </div>
      )}
      <div className="invitation-share-actions">
        <button className="button primary" disabled={!link} onClick={copy}>
          <Copy size={16} />
          {t("invitation.copyLink")}
        </button>
        <button
          className="button outline"
          disabled={!link || sharing}
          onClick={share}
        >
          <Share2 size={16} />
          {sharing ? uiText("ui.2649d27971e2") : t("invitation.share")}
        </button>
        <button
          className="button outline"
          disabled={!link}
          onClick={() => setQrOpen(true)}
        >
          {uiText("ui.2c24d35a117c")}
        </button>
        {link && (
          <>
            <a
              className="button outline"
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={16} />
              {uiText("ui.6a40edf1fc87")}
            </a>
            <a
              className="button outline"
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} />
              {uiText("ui.5aa56ab42916")}
            </a>
          </>
        )}
      </div>
      {qrOpen && link && (
        <InvitationQRCode
          url={link}
          title={event.title}
          onClose={() => setQrOpen(false)}
        />
      )}
      {!published && <p className="helper">{uiText("ui.2ae3a22dbfb1")}</p>}
      {local && <p className="helper">{uiText("ui.36aabc6fd80d")}</p>}
    </section>
  );
}
