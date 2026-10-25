export type MiniSiteSection =
  | "cover"
  | "intro"
  | "countdown"
  | "datetime"
  | "venue"
  | "schedule"
  | "dressCode"
  | "photos"
  | "videos"
  | "registry"
  | "faq"
  | "contact"
  | "rsvp"
  | "closing";
export interface EventMiniSite {
  enabled: boolean;
  sections: MiniSiteSection[];
  color: string;
  background: string;
  font: "Georgia" | "Arial" | "Trebuchet MS";
  backgroundImage?: string;
  schedule: { time: string; title: string }[];
  photos: { url: string; caption: string; visibility?: "private" | "public" }[];
  galleryLayout?: "grid" | "masonry";
  videos: { url: string; title: string }[];
  registry: { url: string; title: string }[];
  faq: { question: string; answer: string }[];
  closing: string;
}
export interface RSVPQuestion {
  label: string;
  type: "text" | "yesno" | "single" | "multiple" | "number" | "dietary";
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
}
export type RSVPAnswers = Record<string, string | boolean | number | string[]>;
export type RSVPStatus = "pending" | "accepted" | "declined" | "maybe";
export interface DesignElement {
  id: string;
  type: "text" | "rect" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fill: string;
  fontSize: number;
  fontFamily: string;
  align: "left" | "center" | "right";
  src?: string;
  rotation: number;
  locked?: boolean;
  opacity?: number;
  groupId?: string;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  crop?: { x: number; y: number; width: number; height: number };
}
export type AnimationPreset =
  | "none"
  | "envelope"
  | "reveal"
  | "fade"
  | "slide"
  | "confetti"
  | "particles"
  | "floral"
  | "elegant";
export interface Design {
  presentation?: "grand-opening";
  background: string;
  version?: number;
  gradient?: { start: string; end: string };
  animation?: AnimationPreset;

  decorated?: boolean;
  palette?: { ink: string; accent: string };
  elements: DesignElement[];
}
export interface Invitation {
  id: string;
  title: string;
  eventType: string;
  hostName: string;
  message: string;
  eventDate: string;
  eventTime: string;
  endTime: string;
  timezone: string;
  venueName: string;
  venueAddress: string;
  googleMapsUrl: string;
  contactNumber: string;
  notes: string;
  latitude: string;
  longitude: string;
  design: Design;
  status: "draft" | "published" | "archived";
  publicShareId?: string;
  rsvpDeadline?: string;
  rsvpQuestions?: Record<string, RSVPQuestion>;
  site?: EventMiniSite;
  allowResponseChanges?: boolean;
  confirmationMessage?: string;
  dressCode?: string;
  eventWebsite?: string;
  countdown?: boolean;
  music?: { url: string; volume: number };

  createdAt?: any;
  updatedAt?: any;
}
export interface Guest {
  firstName?: string;
  lastName?: string;
  category?: string;
  adultCount?: number;
  childCount?: number;
  mealPreference?: string;
  dietaryRestrictions?: string;
  privateNotes?: string;
  tags?: string[];
  source?: "public";
  checkedInAt?: { toDate: () => Date };
  checkedInBy?: string;
  checkedInCount?: number;
  checkedInOverrideReason?: string;
  reminderOptOut?: boolean;
  answers?: RSVPAnswers;
  id: string;
  invitationId: string;
  name: string;
  phoneNumber: string;
  email: string;
  guestCountAllowed: number;
  shareId?: string;
  shareStatus: string;
  rsvpStatus: RSVPStatus;
  respondentName?: string;
  attendeesCount: number;
  openedAt?: any;
  respondedAt?: any;
  createdAt?: any;
}
export interface PublicInvitation {
  mode?: "open";
  ownerUid: string;
  invitationId: string;
  guestId: string;
  guestDisplayName: string;
  guestCountAllowed: number;
  publishedSnapshot: Invitation;
  status: "active" | "revoked";
  createdAt?: any;
}
