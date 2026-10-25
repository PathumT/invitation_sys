import { uiText } from "../../i18n/uiText";
import type { RSVPAnswers, RSVPQuestion } from "../../types";
export function RSVPFields({
  questions = {},
  answers,
  errors,
  disabled,
  onChange,
}: {
  questions?: Record<string, RSVPQuestion>;
  answers: RSVPAnswers;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (answers: RSVPAnswers) => void;
}) {
  return (
    <div className="rsvp-custom-fields">
      {Object.entries(questions).map(([id, q]) => {
        const props = {
          id: `rsvp-${id}`,
          disabled,
          "aria-invalid": !!errors[id],
          "aria-describedby": errors[id] ? `rsvp-${id}-error` : undefined,
        };
        function change(value: RSVPAnswers[string] | undefined) {
          const next = { ...answers };
          if (value === undefined || value === "") delete next[id];
          else next[id] = value;
          onChange(next);
        }
        const choices = q.options || [];
        return (
          <div key={id} className="rsvp-custom-field">
            <label htmlFor={`rsvp-${id}`}>
              {q.label}
              {q.required ? " *" : ""}
            </label>
            {q.type === "text" ? (
              <input
                {...props}
                maxLength={500}
                value={
                  typeof answers[id] === "string" ? (answers[id] as string) : ""
                }
                onChange={(event) => change(event.target.value)}
              />
            ) : q.type === "number" ? (
              <input
                {...props}
                type="number"
                min={q.min ?? 0}
                max={q.max ?? 1000}
                step={1}
                value={
                  typeof answers[id] === "number" ? (answers[id] as number) : ""
                }
                onChange={(event) =>
                  change(
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                  )
                }
              />
            ) : q.type === "multiple" ? (
              <select
                {...props}
                multiple
                value={
                  Array.isArray(answers[id]) ? (answers[id] as string[]) : []
                }
                onChange={(event) =>
                  change(
                    Array.from(
                      event.target.selectedOptions,
                      (option) => option.value,
                    ),
                  )
                }
              >
                {choices.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <select
                {...props}
                value={answers[id] === undefined ? "" : String(answers[id])}
                onChange={(event) =>
                  change(
                    q.type === "yesno"
                      ? event.target.value === ""
                        ? undefined
                        : event.target.value === "true"
                      : event.target.value,
                  )
                }
              >
                <option value="">{uiText("ui.8cf0e32e7235")}</option>
                {q.type === "yesno" ? (
                  <>
                    <option value="true">{uiText("ui.85a39ab345d6")}</option>
                    <option value="false">{uiText("ui.1ea442a134b2")}</option>
                  </>
                ) : (
                  choices.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))
                )}
              </select>
            )}
            {errors[id] && (
              <small id={`rsvp-${id}-error`} className="error" role="alert">
                {errors[id]}
              </small>
            )}
          </div>
        );
      })}
      {errors.form && (
        <p role="alert" className="error">
          {errors.form}
        </p>
      )}
    </div>
  );
}
