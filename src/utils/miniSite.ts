import type { EventMiniSite, MiniSiteSection } from "../types";
export const siteSections: { id: MiniSiteSection; label: string }[] = [
  { id: "cover", label: "Invitation artwork" },
  { id: "intro", label: "Title and introduction" },
  { id: "countdown", label: "Countdown" },
  { id: "datetime", label: "Date and time" },
  { id: "venue", label: "Venue and map" },
  { id: "schedule", label: "Event schedule" },
  { id: "dressCode", label: "Dress code" },
  { id: "photos", label: "Photo gallery" },
  { id: "videos", label: "Video gallery" },
  { id: "registry", label: "Gift registry" },
  { id: "faq", label: "Frequently asked questions" },
  { id: "contact", label: "Contact" },
  { id: "rsvp", label: "RSVP" },
  { id: "closing", label: "Closing message" },
];
export function initialMiniSite(): EventMiniSite {
  return {
    enabled: true,
    sections: siteSections.map((section) => section.id),
    color: "#004b3d",
    background: "#fff8ed",
    font: "Georgia",
    schedule: [],
    photos: [],
    videos: [],
    registry: [],
    faq: [],
    closing: "Thank you for being part of our celebration.",
  };
}
export function secureWebsite(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      value.length <= 2048
      ? url.href
      : "";
  } catch {
    return "";
  }
}
export function publishedMedia(value: string) {
  const secure = secureWebsite(value);
  if (secure) return secure;
  if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === "true") {
    try {
      const url = new URL(value);
      if (
        url.protocol === "http:" &&
        ["127.0.0.1", "localhost"].includes(url.hostname) &&
        url.port === "9199" &&
        url.pathname.startsWith("/v0/b/") &&
        !url.username &&
        !url.password
      )
        return url.href;
    } catch {
      /* Only local Storage emulator URLs may use HTTP. */
    }
  }
  return "";
}
export function videoEmbed(value: string) {
  try {
    const url = new URL(secureWebsite(value));
    let id = "";
    if (url.hostname === "youtu.be") id = url.pathname.slice(1);
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)
    )
      id =
        url.searchParams.get("v") ||
        (url.pathname.startsWith("/embed/") ? url.pathname.slice(7) : "");
    if (/^[a-zA-Z0-9_-]{11}$/.test(id))
      return `https://www.youtube-nocookie.com/embed/${id}`;
    if (
      ["vimeo.com", "www.vimeo.com"].includes(url.hostname) &&
      /^\/\d+$/.test(url.pathname)
    )
      return `https://player.vimeo.com/video/${url.pathname.slice(1)}`;
  } catch {
    /* Invalid video URLs never become iframe sources. */
  }
  return "";
}
export function miniSiteError(site?: EventMiniSite) {
  if (!site?.enabled) return "";
  if (
    !site.sections.length ||
    new Set(site.sections).size !== site.sections.length ||
    site.sections.some(
      (id) => !siteSections.some((section) => section.id === id),
    )
  )
    return "Choose at least one different website section.";
  if (
    !/^#[a-f0-9]{6}$/i.test(site.color) ||
    !/^#[a-f0-9]{6}$/i.test(site.background) ||
    !["Georgia", "Arial", "Trebuchet MS"].includes(site.font)
  )
    return "Choose valid website colors and a supported font.";
  if (site.backgroundImage && !publishedMedia(site.backgroundImage))
    return "Use a secure background image.";
  if (
    site.schedule.length > 20 ||
    site.schedule.some(
      (item) =>
        !item.time.trim() ||
        !item.title.trim() ||
        item.time.length > 40 ||
        item.title.length > 160,
    )
  )
    return "Use up to twenty schedule items with a time and title.";
  if (
    site.photos.length > 12 ||
    site.photos.some(
      (item) => !publishedMedia(item.url) || item.caption.length > 160,
    )
  )
    return "Use up to twelve secure photos with captions of 160 characters or fewer.";
  if (
    site.videos.length > 6 ||
    site.videos.some(
      (item) =>
        !videoEmbed(item.url) || !item.title.trim() || item.title.length > 160,
    )
  )
    return "Add up to six titled YouTube or Vimeo videos.";
  if (
    site.registry.length > 10 ||
    site.registry.some(
      (item) =>
        !secureWebsite(item.url) ||
        !item.title.trim() ||
        item.title.length > 160,
    )
  )
    return "Add up to ten titled secure registry links.";
  if (
    site.faq.length > 10 ||
    site.faq.some(
      (item) =>
        !item.question.trim() ||
        !item.answer.trim() ||
        item.question.length > 160 ||
        item.answer.length > 1000,
    )
  )
    return "Add up to ten questions and answers (160/1,000 characters).";
  if (site.closing.length > 1000)
    return "Use up to 1,000 characters for the closing message.";
  return "";
}
