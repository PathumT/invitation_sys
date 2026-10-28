import { uiText } from "../../../i18n/uiText";
import { useState } from "react";
import {
  Check,
  Crown,
  Flower2,
  Mail,
  Minus,
  Play,
  Sparkles,
} from "lucide-react";
import { Modal } from "../../ui/Modal";
import { DesignPreview } from "../DesignPreview";
import type { AnimationPreset, Design, Invitation } from "../../../types";
import { InvitationOpeningRenderer } from "./InvitationOpeningRenderer";
import {
  openingStyles,
  resolveOpeningStyle,
  type OpeningStyle,
} from "./openingStyles";
const icons = {
  "classic-envelope": Mail,
  "luxury-golden": Sparkles,
  "floral-bloom": Flower2,
  "royal-curtain": Crown,
  "modern-minimal": Minus,
};
export function OpeningAnimationPicker({
  design,
  event,
  onChange,
}: {
  design: Design;
  event: Invitation;
  onChange: (animation: AnimationPreset) => void;
}) {
  const [preview, setPreview] = useState<OpeningStyle | null>(null);
  const [replay, setReplay] = useState(0);
  const selected = resolveOpeningStyle(design.animation);
  return (
    <section
      className="opening-picker"
      aria-labelledby="opening-animation-heading"
    >
      <div className="opening-picker-heading">
        <div>
          <h3 id="opening-animation-heading">{uiText("ui.f7cb07f4eb4b")}</h3>
          <p>{uiText("ui.8ea5affbc8b8")}</p>
        </div>
        <button
          type="button"
          className="button outline small"
          aria-pressed={!selected}
          onClick={() => onChange("none")}
        >
          {uiText("ui.8df7155e2e42")}
          {!selected && <Check size={14} />}
        </button>
      </div>
      <div className="opening-options">
        {openingStyles.map((item) => {
          const Icon = icons[item.key];
          return (
            <article
              key={item.key}
              className={`opening-option ${selected === item.key ? "is-selected" : ""}`}
              aria-label={item.name}
            >
              <div
                className={`opening-thumbnail opening-${item.key}`}
                aria-hidden="true"
              >
                <div className="thumbnail-frame" />
                <Icon size={36} strokeWidth={1} />
                <span>{uiText("ui.cfe1b4640f0e")}</span>
                {selected === item.key && (
                  <b className="opening-selected">
                    <Check size={12} />
                    {uiText("ui.14b049b1adf4")}
                  </b>
                )}
              </div>
              <h4>{item.name}</h4>
              <p>{item.description}</p>
              <small>
                {item.duration / 1000}
                {uiText("ui.043a718774c5")}
              </small>
              <div className="opening-option-actions">
                <button
                  type="button"
                  className="button outline small"
                  onClick={() => {
                    setReplay(0);
                    setPreview(item.key);
                  }}
                  aria-label={uiText("ui.1a02babac814", {
                    value0: String(item.name),
                  })}
                >
                  <Play size={13} />
                  {uiText("ui.a79cfcd221db")}
                </button>
                <button
                  type="button"
                  className="button primary small"
                  aria-pressed={selected === item.key}
                  onClick={() => onChange(item.key)}
                  aria-label={uiText("ui.8cac46f15abe", {
                    value0: String(item.name),
                  })}
                >
                  {selected === item.key
                    ? uiText("ui.57fd7a0cf33f")
                    : uiText("ui.e49b0b35359b")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {preview && (
        <Modal
          title={uiText("ui.7ef31a1033ef", {
            value0: String(
              openingStyles.find((item) => item.key === preview)!.name,
            ),
          })}
          onClose={() => setPreview(null)}
          className="opening-preview-modal"
        >
          <InvitationOpeningRenderer
            key={`${preview}-${replay}`}
            style={preview}
            title={event.title || "A special celebration"}
            hostName={event.hostName}
            preview
            autoPlay
          >
            <div className="opening-preview-result">
              <p>{uiText("ui.2aa73accb2ce")}</p>
              <DesignPreview design={design} event={event} />
            </div>
          </InvitationOpeningRenderer>
          <div className="opening-preview-footer">
            <small>{uiText("ui.260e2643b063")}</small>
            <button
              type="button"
              className="button outline"
              onClick={() => setReplay((value) => value + 1)}
            >
              {uiText("ui.c49b4964fe15")}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
