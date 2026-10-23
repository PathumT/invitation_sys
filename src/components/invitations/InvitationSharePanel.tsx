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
          if (!cancelled) setLink(shareUrl(id));
        })
        .catch((e) => {
          if (!cancelled) setError(errorMessage(e));
        });
    return () => {
      cancelled = true;
    };
  }, [event.id, event.status, retry, published]);
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
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(link);
      toast.success("Public invitation link copied. Anyone can respond.");
    } catch {
      input.current?.focus();
      input.current?.select();
      toast.info("Select and copy the invitation link from the field.");
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
        toast.error(
          "Sharing could not open. Use Copy public link or WhatsApp instead.",
        );
    } finally {
      setSharing(false);
    }
  }
  return (
    <section
      className="invitation-share-panel"
      aria-label="Share your invitation"
    >
      <div className="invitation-share-heading">
        <span className="share-panel-icon">
          <Link2 size={20} />
        </span>
        <div>
          <h3>Share your invitation</h3>
          <p>
            Anyone with this link can enter their name and accept or decline.
          </p>
        </div>
      </div>
      <label className="invitation-link-label">
        Invitation link
        <input
          ref={input}
          type="text"
          readOnly
          value={link}
          placeholder={
            published
              ? error
                ? "Link could not be generated"
                : "Generating your invitation link…"
              : "Publish your invitation to generate a shareable link"
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
            Retry link generation
          </button>
        </div>
      )}
      <div className="invitation-share-actions">
        <button className="button primary" disabled={!link} onClick={copy}>
          <Copy size={16} />
          Copy public link
        </button>
        <button
          className="button outline"
          disabled={!link || sharing}
          onClick={share}
        >
          <Share2 size={16} />
          {sharing ? "Opening share…" : "Share invitation"}
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
              WhatsApp
            </a>
            <a
              className="button outline"
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} />
              Open invitation
            </a>
          </>
        )}
      </div>
      {!published && (
        <p className="helper">
          Add the event title, host, date, time and venue, then click Publish
          invitation. Your link will appear here after publishing succeeds.
        </p>
      )}
      {local && (
        <p className="helper">
          This link uses localhost. Set VITE_APP_URL to your published website
          address and restart the app to share it with other devices.
        </p>
      )}
    </section>
  );
}
