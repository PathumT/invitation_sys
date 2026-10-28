import { describe, expect, it } from "vitest";
import { answerErrors, questionSchemaError } from "../src/utils/rsvpQuestions";
import type { RSVPAnswers, RSVPQuestion } from "../src/types";
const questions: Record<string, RSVPQuestion> = {
  q0: { label: "Note", type: "text", required: true },
  q1: { label: "Parking", type: "yesno", required: true },
  q2: { label: "Meal", type: "single", required: true, options: ["A", "B"] },
  q3: {
    label: "Activities",
    type: "multiple",
    required: true,
    options: ["A", "B"],
  },
  q4: { label: "Number", type: "number", required: true, min: 1, max: 5 },
  q5: {
    label: "Diet",
    type: "dietary",
    required: true,
    options: ["None", "Vegan"],
  },
};
const answers: RSVPAnswers = {
  q0: "Hello",
  q1: false,
  q2: "A",
  q3: ["A", "B"],
  q4: 3,
  q5: "Vegan",
};
describe("custom RSVP questions", () => {
  it("validates every supported answer type, including a required No answer", () => {
    expect(questionSchemaError(questions)).toBe("");
    expect(answerErrors(questions, answers, true)).toEqual({});
  });
  it("requires configured answers only when accepting", () => {
    expect(Object.keys(answerErrors(questions, {}, true))).toHaveLength(6);
    expect(answerErrors(questions, {}, false)).toEqual({});
  });
  it("rejects tampered types, unknown choices, duplicate choices and out-of-range values", () => {
    for (const [key, value] of Object.entries({
      q0: " ",
      q1: "false",
      q2: "Unknown",
      q3: ["A", "A"],
      q4: 6,
      q5: "Unknown",
    }))
      expect(
        answerErrors(questions, { ...answers, [key]: value }, true),
      ).toHaveProperty(key);
    expect(
      answerErrors(questions, { ...answers, unknown: "value" }, true),
    ).toHaveProperty("form");
  });
  it("rejects invalid author schemas", () => {
    expect(questionSchemaError({ ...questions, q6: questions.q0 })).not.toBe(
      "",
    );
    expect(
      questionSchemaError({ q0: { ...questions.q2, options: ["A", "A"] } }),
    ).not.toBe("");
    expect(
      questionSchemaError({ q0: { ...questions.q4, min: 10, max: 5 } }),
    ).not.toBe("");
  });
});
