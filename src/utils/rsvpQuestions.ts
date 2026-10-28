import { uiText } from "../i18n/uiText";
import type { RSVPAnswers, RSVPQuestion } from "../types";
export const questionIds = ["q0", "q1", "q2", "q3", "q4", "q5"];
export function questionSchemaError(
  questions: Record<string, RSVPQuestion> = {},
) {
  if (
    Object.keys(questions).length > 6 ||
    Object.keys(questions).some((id) => !questionIds.includes(id))
  )
    return "Use up to six questions.";
  for (const question of Object.values(questions)) {
    if (!question.label.trim() || question.label.length > 160)
      return "Give each question a label of up to 160 characters.";
    if (
      !["text", "yesno", "single", "multiple", "number", "dietary"].includes(
        question.type,
      )
    )
      return "Choose a supported question type.";
    if (
      ["single", "multiple", "dietary"].includes(question.type) &&
      (!question.options?.length ||
        question.options.length > 10 ||
        question.options.some(
          (option) => !option.trim() || option.length > 100,
        ) ||
        new Set(question.options).size !== question.options.length)
    )
      return "Provide one to ten different, nonempty choices, up to 100 characters each.";
    if (
      question.type === "number" &&
      (!Number.isInteger(question.min ?? 0) ||
        !Number.isInteger(question.max ?? 1000) ||
        (question.min ?? 0) < 0 ||
        (question.max ?? 1000) > 1000 ||
        (question.min ?? 0) > (question.max ?? 1000))
    )
      return "Numeric questions need whole-number bounds between 0 and 1,000.";
  }
  return "";
}
export function answerErrors(
  questions: Record<string, RSVPQuestion> = {},
  answers: RSVPAnswers,
  accepted: boolean,
) {
  const errors: Record<string, string> = {};
  for (const [id, q] of Object.entries(questions)) {
    const value = answers[id];
    if (
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && !value.length)
    ) {
      if (accepted && q.required) errors[id] = uiText("ui.b504b662563f");
      continue;
    }
    const valid =
      q.type === "text"
        ? typeof value === "string" &&
          value.length <= 500 &&
          (!q.required || !!value.trim())
        : q.type === "yesno"
          ? typeof value === "boolean"
          : q.type === "number"
            ? typeof value === "number" &&
              Number.isInteger(value) &&
              value >= (q.min ?? 0) &&
              value <= (q.max ?? 1000)
            : q.type === "multiple"
              ? Array.isArray(value) &&
                value.length <= 10 &&
                new Set(value).size === value.length &&
                value.every((option) => q.options?.includes(option))
              : typeof value === "string" && !!q.options?.includes(value);
    if (!valid) errors[id] = uiText("ui.6fbcb764ac0f");
  }
  if (Object.keys(answers).some((id) => !questions[id]))
    errors.form = uiText("ui.699fd1d3ab41");
  return errors;
}
