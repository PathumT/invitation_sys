export const planDefinitions = [
  {
    id: "free",
    name: "Free",
    features: ["Limited invitations", "Basic templates", "Basic RSVP tracking"],
  },
  {
    id: "pro",
    name: "Pro",
    features: [
      "More invitations",
      "Premium templates",
      "Animated invitations",
      "Advanced RSVP forms",
      "QR export",
      "Enhanced analytics",
    ],
  },
  {
    id: "business",
    name: "Business",
    features: [
      "Team collaboration",
      "Custom branding",
      "Higher usage limits",
      "Event management tools",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    features: [
      "White-label support",
      "Custom domain",
      "Organization management",
      "Advanced reporting",
    ],
  },
] as const;
export type TeamRole =
  "owner" | "admin" | "editor" | "event-manager" | "viewer";
export type Permission =
  | "create"
  | "edit"
  | "guests"
  | "analytics"
  | "check-in"
  | "settings"
  | "invite";
export const rolePermissions: Record<TeamRole, Permission[]> = {
  owner: [
    "create",
    "edit",
    "guests",
    "analytics",
    "check-in",
    "settings",
    "invite",
  ],
  admin: [
    "create",
    "edit",
    "guests",
    "analytics",
    "check-in",
    "settings",
    "invite",
  ],
  editor: ["create", "edit"],
  "event-manager": ["guests", "analytics", "check-in"],
  viewer: ["analytics"],
};
export function canUsePreparedRole(
  role: TeamRole,
  permission: Permission,
  verifiedTeamActivation = false,
) {
  return (
    (role === "owner" || verifiedTeamActivation) &&
    rolePermissions[role].includes(permission)
  );
}
// Browser-side presentation contracts only. Security Rules and trusted server verification remain authoritative.
export interface VerifiedMembership {
  tenantId: string;
  userId: string;
  role: TeamRole;
  status: "active" | "revoked";
  acceptedAt: unknown;
  createdAt: unknown;
}
export interface ServerEntitlement {
  plan: (typeof planDefinitions)[number]["id"];
  status: "active" | "expired";
  validUntil: unknown;
  billingCustomerId: string;
  updatedAt: unknown;
}
