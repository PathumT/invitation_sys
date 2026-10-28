import { uiText } from "../../i18n/uiText";
import type { RSVPQuestion } from "../../types";
import { questionIds } from "../../utils/rsvpQuestions";
export function RSVPQuestionBuilder({
  questions = {},
  onChange,
}: {
  questions?: Record<string, RSVPQuestion>;
  onChange: (value: Record<string, RSVPQuestion>) => void;
}) {
  function patch(id: string, value: Partial<RSVPQuestion>) {
    onChange({ ...questions, [id]: { ...questions[id], ...value } });
  }
  return (
    <fieldset className="invitation-experience-options">
      <legend>{uiText("ui.32df80b94112")}</legend>
      <p className="helper">{uiText("ui.d8c38e297b64")}</p>
      {Object.entries(questions).map(([id, q], index) => (
        <fieldset key={id} className="rsvp-question-edit">
          <legend>
            {uiText("ui.39821a754d34")}
            {index + 1}
          </legend>
          <label>
            {uiText("ui.4d2e34550244")}
            <input
              maxLength={160}
              value={q.label}
              onChange={(event) => patch(id, { label: event.target.value })}
            />
          </label>
          <label>
            {uiText("ui.efe8656fc7c2")}
            <select
              value={q.type}
              onChange={(event) => {
                const type = event.target.value as RSVPQuestion["type"];
                patch(id, {
                  type,
                  ...(["single", "multiple", "dietary"].includes(type)
                    ? {
                        options:
                          q.options ||
                          (type === "dietary"
                            ? ["No preference", "Vegetarian", "Vegan", "Other"]
                            : ["Option 1", "Option 2"]),
                      }
                    : {}),
                });
              }}
            >
              <option value="text">{uiText("ui.38a11505fddd")}</option>
              <option value="yesno">{uiText("ui.c00e6554e94d")}</option>
              <option value="single">{uiText("ui.45a76a9d2e7a")}</option>
              <option value="multiple">{uiText("ui.79fefc32357d")}</option>
              <option value="number">{uiText("ui.bd82cf16699b")}</option>
              <option value="dietary">{uiText("ui.742b8370175b")}</option>
            </select>
          </label>
          {["single", "multiple", "dietary"].includes(q.type) && (
            <label>
              {uiText("ui.ed825f731926")}
              <textarea
                rows={3}
                value={(q.options || []).join("\n")}
                onChange={(event) =>
                  patch(id, { options: event.target.value.split("\n") })
                }
              />
            </label>
          )}
          {q.type === "number" && (
            <div className="form-grid">
              <label>
                {uiText("ui.735beee2e390")}
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={q.min ?? 0}
                  onChange={(event) => patch(id, { min: +event.target.value })}
                />
              </label>
              <label>
                {uiText("ui.66c9ab177708")}
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={q.max ?? 1000}
                  onChange={(event) => patch(id, { max: +event.target.value })}
                />
              </label>
            </div>
          )}
          <label>
            <input
              type="checkbox"
              checked={q.required}
              onChange={(event) =>
                patch(id, { required: event.target.checked })
              }
            />
            {uiText("ui.f0c3fb4cd63d")}
          </label>
          <button
            type="button"
            className="button outline small"
            onClick={() => {
              const next = { ...questions };
              delete next[id];
              onChange(next);
            }}
          >
            {uiText("ui.1cfcaf7a67c9")}
            {index + 1}
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="button outline"
        disabled={Object.keys(questions).length >= 6}
        onClick={() => {
          const id = questionIds.find((id) => !questions[id]);
          if (id)
            onChange({
              ...questions,
              [id]: { label: "", type: "text", required: false },
            });
        }}
      >
        {uiText("ui.5ef90af59e0e")}
      </button>
    </fieldset>
  );
}
