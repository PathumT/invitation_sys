import { describe, it, expect } from "vitest";
import { migrateV1 } from "../scripts/migrations/v1-upgrade.mjs";
import { canUsePreparedRole, planDefinitions } from "../src/config/platform";
import { defaultTenantBrand, tenantBrandError } from "../src/utils/tenantBrand";
import {
  recordDiagnostic,
  browserDiagnostics,
  diagnosticPath,
} from "../src/utils/diagnostics";
import { occasionMessage } from "../src/utils/designSuggestions";
describe("safe platform foundations", () => {
  it("does not activate non-owner roles by default", () => {
    expect(canUsePreparedRole("owner", "invite")).toBe(true);
    expect(canUsePreparedRole("admin", "invite")).toBe(false);
    expect(canUsePreparedRole("viewer", "edit", true)).toBe(false);
    expect(planDefinitions.map((plan) => plan.id)).toEqual([
      "free",
      "pro",
      "business",
      "enterprise",
    ]);
  });
  it("validates safe branding and deterministic non-AI suggestions", () => {
    expect(tenantBrandError(defaultTenantBrand)).toBe("");
    expect(
      tenantBrandError({ ...defaultTenantBrand, primaryColor: "red;url()" }),
    ).not.toBe("");
    expect(
      occasionMessage({ title: "Our Day", eventType: "Wedding" }),
    ).toContain("Our Day");
  });
  it("keeps diagnostics free of messages, contact details and capability tokens", () => {
    const token = "a".repeat(48);
    recordDiagnostic(
      new Error("private@example.test secret-password"),
      `/i/${token}/private-host?key=secret`,
    );
    const last = browserDiagnostics().at(-1)!;
    expect(last.path).toBe("/i/[invitation]");
    expect(JSON.stringify(last)).not.toContain("private");
    expect(JSON.stringify(last)).not.toContain("secret");
    expect(diagnosticPath("/invitations/private-id/edit?token=secret")).toBe(
      "/invitations/[invitation]/edit",
    );
  });
  it("migrates offline designs idempotently while preserving IDs, elements and responses", () => {
    const input = {
      invitations: [
        {
          id: "event",
          design: {
            background: "#fff",
            elements: [{ id: "original", text: "Hello" }],
          },
        },
      ],
      guests: [{ id: "guest", privateNotes: "Keep" }],
      publicInvitations: [
        {
          id: "a".repeat(48),
          publishedSnapshot: { design: { elements: [] } },
          response: { respondentName: "Guest", rsvpStatus: "accepted" },
        },
      ],
    };
    const output = migrateV1(input);
    expect(output.invitations[0].id).toBe("event");
    expect(output.invitations[0].design.elements).toEqual(
      input.invitations[0].design.elements,
    );
    expect(output.publicInvitations).toMatchObject([
      {
        id: input.publicInvitations[0].id,
        response: input.publicInvitations[0].response,
      },
    ]);
    expect(output.guests).toEqual(input.guests);
    expect(migrateV1(output)).toEqual(output);
    expect(input.invitations[0].design).not.toHaveProperty("version");
  });
});
