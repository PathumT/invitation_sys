import { uiText } from "../../i18n/uiText";
import { invitationFont } from "../../utils/invitationFont";
import { useState, type ReactNode, type CSSProperties } from "react";
import type { Invitation } from "../../types";
import { DesignPreview } from "./DesignPreview";
import { EventCountdown, InvitationMusic } from "./InvitationPresentation";
import { Brand } from "../Brand";
import { mapsUrl } from "../../utils";
import {
  secureWebsite,
  publishedMedia,
  videoEmbed,
} from "../../utils/miniSite";
function Video({ url, title }: { url: string; title: string }) {
  const [play, setPlay] = useState(false);
  const source = videoEmbed(url);
  if (!source) return null;
  return (
    <div className="site-video">
      {play ? (
        <iframe
          src={source}
          title={title}
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="fullscreen; picture-in-picture"
        />
      ) : (
        <button className="button outline" onClick={() => setPlay(true)}>
          {uiText("ui.0d04f37879f8")}
          {title}
        </button>
      )}
    </div>
  );
}
export function EventMiniSite({
  event,
  rsvp,
}: {
  event: Invitation;
  rsvp: ReactNode;
}) {
  const site = event.site!;
  let location = "";
  try {
    location = mapsUrl(
      event.googleMapsUrl,
      event.latitude,
      event.longitude,
      event.venueAddress,
    );
  } catch {
    /* The host can still provide contact information. */
  }
  const sections: Record<string, ReactNode> = {
    cover: <DesignPreview design={event.design} event={event} />,
    intro: (
      <>
        <span className="eyebrow">{uiText("ui.cfe1b4640f0e")}</span>
        <h1>{event.title}</h1>
        <p>
          {uiText("ui.d04444a24aef")}
          {event.hostName}
        </p>
        <p>{event.message}</p>
        <InvitationMusic event={event} />
      </>
    ),
    countdown: <EventCountdown event={{ ...event, countdown: true }} />,
    datetime: (
      <>
        <h2>{uiText("ui.e12fa5363dd4")}</h2>
        <p>
          {event.eventDate} / {event.eventTime}
          {event.endTime
            ? uiText("ui.eebdeee5b989", { value0: String(event.endTime) })
            : ""}
        </p>
        <p>{event.timezone}</p>
      </>
    ),
    venue: (
      <>
        <h2>{uiText("ui.55876489dee5")}</h2>
        <h3>{event.venueName}</h3>
        <p>{event.venueAddress}</p>
        {location && (
          <a
            className="button outline"
            href={location}
            target="_blank"
            rel="noopener noreferrer"
          >
            {uiText("ui.3fe1eea77c0a")}
          </a>
        )}
      </>
    ),
    schedule: site.schedule.length ? (
      <>
        <h2>{uiText("ui.09ad3c5382ec")}</h2>
        <ol className="site-schedule">
          {site.schedule.map((item, index) => (
            <li key={index}>
              <strong>{item.time}</strong>
              <span>{item.title}</span>
            </li>
          ))}
        </ol>
      </>
    ) : null,
    dressCode: event.dressCode ? (
      <>
        <h2>{uiText("ui.aec10bba70e3")}</h2>
        <p>{event.dressCode}</p>
      </>
    ) : null,
    photos: site.photos.length ? (
      <>
        <h2>{uiText("ui.4c35e1f41831")}</h2>
        <div
          className={`site-photo-grid ${site.galleryLayout === "masonry" ? "site-photo-masonry" : ""}`}
        >
          {site.photos
            .filter(
              (photo) =>
                photo.visibility !== "private" && publishedMedia(photo.url),
            )
            .map((photo, index) => (
              <figure key={index}>
                <img
                  src={photo.url}
                  alt={photo.caption || "Event photo"}
                  loading="lazy"
                  decoding="async"
                  width={480}
                  height={360}
                />
                {photo.caption && <figcaption>{photo.caption}</figcaption>}
              </figure>
            ))}
        </div>
      </>
    ) : null,
    videos: site.videos.length ? (
      <>
        <h2>{uiText("ui.a91b4769b1a6")}</h2>
        {site.videos.map((video, index) => (
          <Video key={index} {...video} />
        ))}
      </>
    ) : null,
    registry: site.registry.length ? (
      <>
        <h2>{uiText("ui.ba1353b9ca76")}</h2>
        <ul>
          {site.registry
            .filter((link) => secureWebsite(link.url))
            .map((link, index) => (
              <li key={index}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.title}
                </a>
              </li>
            ))}
        </ul>
      </>
    ) : null,
    faq: site.faq.length ? (
      <>
        <h2>{uiText("ui.aab7685123cf")}</h2>
        {site.faq.map((item, index) => (
          <details key={index}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </>
    ) : null,
    contact: (
      <>
        <h2>{uiText("ui.ffbc51641485")}</h2>
        {event.contactNumber && (
          <p>
            <a href={`tel:${event.contactNumber.replace(/[^+\d]/g, "")}`}>
              {uiText("ui.dec0d13d7eb4")}
              {event.hostName}: {event.contactNumber}
            </a>
          </p>
        )}
        {secureWebsite(event.eventWebsite || "") && (
          <a
            href={event.eventWebsite}
            target="_blank"
            rel="noopener noreferrer"
          >
            {uiText("ui.58b2eeb7fffa")}
          </a>
        )}
        {event.notes && <p>{event.notes}</p>}
      </>
    ),
    rsvp,
    closing: <p className="site-closing">{site.closing}</p>,
  };
  return (
    <article
      className="event-mini-site"
      aria-label={uiText("ui.518a40b31aab", { value0: String(event.title) })}
      style={
        {
          "--site-color": site.color,
          backgroundColor: site.background,
          fontFamily: invitationFont(site.font),
          backgroundImage: publishedMedia(site.backgroundImage || "")
            ? `url(${JSON.stringify(site.backgroundImage)})`
            : undefined,
        } as CSSProperties
      }
    >
      {site.sections.map((id) =>
        sections[id] ? (
          <section
            className={`mini-site-section site-section-${id}`}
            key={id}
            aria-label={id}
          >
            {sections[id]}
          </section>
        ) : null,
      )}
      <footer className="guest-footer">
        <Brand compact />
      </footer>
    </article>
  );
}
