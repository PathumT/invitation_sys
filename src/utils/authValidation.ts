import { z } from "zod";
export const authSchema = (registration: boolean) =>
  z
    .object({
      name: z.string(),
      email: z.string().trim().email("Enter a valid email."),
      password: z.string().min(8, "Use at least 8 characters."),
      confirm: z.string(),
    })
    .superRefine((value, context) => {
      if (!registration) return;
      if (value.name.trim().length < 2 || value.name.trim().length > 160)
        context.addIssue({
          code: "custom",
          path: ["name"],
          message: "Enter your full name (2 to 160 characters).",
        });
      if (value.password !== value.confirm)
        context.addIssue({
          code: "custom",
          path: ["confirm"],
          message: "Passwords do not match.",
        });
    });
