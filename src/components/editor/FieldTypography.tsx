import { uiText } from "../../i18n/uiText";
import { useEditorStore } from "../../hooks/editorStore";
import type { DesignElement } from "../../types";

const fonts = ["Arial", "Georgia", "Verdana", "Trebuchet MS", "Times New Roman", "Courier New", "Noto Sans Sinhala", "Noto Sans Tamil", "Nirmala UI", "Impact", "Arial Black"];

export function FieldTypography({ field, label }: { field: string; label: string }) {
  const { design, set } = useEditorStore();
  const elements = design.elements.filter((el) => el.type === "text" && el.text?.includes(`{{${field}}}`));
  const element = elements[0];
  if (!element) return null;
  function patch(value: Partial<DesignElement>) {
    set({ ...design, elements: design.elements.map((el) => elements.includes(el) ? { ...el, ...value } : el) });
  }
  return (
    <fieldset style={{ border: "1px solid #d5d9d5", borderRadius: 8, padding: 12, minWidth: 0 }}>
      <legend>{label}{uiText("ui.858db341abf2")}</legend>
      <div className="form-row">
        <label>{uiText("ui.64d0b3adcd2d")}<select value={element.fontFamily} onChange={(e) => patch({ fontFamily: e.target.value })}>
            {[...new Set([element.fontFamily, ...fonts])].map((font) => <option key={font}>{font}</option>)}
          </select>
        </label>
        <label>{uiText("ui.1af851907331")}<input type="number" min={8} max={160} value={element.fontSize} onChange={(e) => {
            const size = e.target.valueAsNumber;
            if (Number.isFinite(size)) patch({ fontSize: Math.max(8, Math.min(160, size)) });
          }} />
        </label>
        <label>{uiText("ui.3a9dfa58df63")}<input type="color" value={element.fill} onChange={(e) => patch({ fill: e.target.value })} />
        </label>
        <label>{uiText("ui.9d597870c4b3")}<select value={element.align} onChange={(e) => patch({ align: e.target.value as DesignElement["align"] })}>
            {["left", "center", "right"].map((align) => <option key={align}>{align}</option>)}
          </select>
        </label>
      </div>
      <small>{uiText("ui.55416ae2efd9")}</small>
    </fieldset>
  );
}
