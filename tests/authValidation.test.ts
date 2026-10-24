import { describe, expect, it } from "vitest";
import { authSchema } from "../src/utils/authValidation";
const valid = {
  name: "Alex Morgan",
  email: "alex@example.test",
  password: "StrongPassword123!",
  confirm: "StrongPassword123!",
};
describe("registration validation", () => {
  it("accepts valid details and trims email", () =>
    expect(
      authSchema(true).parse({ ...valid, email: " alex@example.test " }).email,
    ).toBe("alex@example.test"));
  it("reports required name, email, length, and confirmation errors by field", () => {
    const result = authSchema(true).safeParse({
      name: " ",
      email: "invalid",
      password: "short",
      confirm: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["name", "email", "password", "confirm"]),
      );
  });
  it("does not require name or confirmation on login", () =>
    expect(
      authSchema(false).safeParse({ ...valid, name: "", confirm: "" }).success,
    ).toBe(true));
});
