import { i18n } from "../i18n";
import { z } from "zod";
export const authSchema = (registration: boolean) =>
  z
    .object({
      name: z.string(),
      email: z.string().trim().email(i18n.t("validation.email")),
      password: z.string().min(8, i18n.t("validation.passwordMin")),
      confirm: z.string(),
    })
    .superRefine((value, context) => {
      if (!registration) return;
      if (value.name.trim().length < 2 || value.name.trim().length > 160)
        context.addIssue({
          code: "custom",
          path: ["name"],
          message: i18n.t("validation.fullName"),
        });
      if (value.password !== value.confirm)
        context.addIssue({
          code: "custom",
          path: ["confirm"],
          message: i18n.t("validation.passwordMismatch"),
        });
    });
