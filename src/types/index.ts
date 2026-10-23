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
}
export interface Design {
  presentation?: "grand-opening";
  background: string;
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
  createdAt?: any;
  updatedAt?: any;
}
export interface Guest {
  source?: "public";
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
