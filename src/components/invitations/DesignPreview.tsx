import { fitInvitationText } from "../../utils/fitInvitationText";
import { uiText } from "../../i18n/uiText";
import { invitationFont } from "../../utils/invitationFont";
import type { Design, Invitation } from "../../types";
import { interpolate } from "../../utils";
export function DesignPreview({
  design,
  event,
  guest,
  mini = false,
}: {
  design: Design;
  event: Partial<Invitation>;
  guest?: string;
  mini?: boolean;
}) {
  return (
    <div className={`design-preview ${mini ? "mini" : ""}`}>
      <div
        className="design-inner"
        style={{
          background: design.gradient
            ? `linear-gradient(146.31deg, ${design.gradient.start}, ${design.gradient.end})`
            : design.background,
        }}
      >
        {!design.decorated && <div className="card-ornament">✳</div>}
        {design.elements.map((el) => (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: `${el.x / 4.8}%`,
              top: `${el.y / 7.2}%`,
              width: `${el.width / 4.8}%`,
              height: `${el.height / 7.2}%`,
              color: el.fill,
              opacity: el.opacity ?? 1,
              textShadow: el.shadowBlur
                ? `${(el.shadowOffsetX || 0) / 4.8}cqw ${(el.shadowOffsetY || 0) / 4.8}cqw ${el.shadowBlur / 4.8}cqw ${el.shadowColor || "#000000"}`
                : undefined,
              background: el.type === "rect" ? el.fill : undefined,
              fontSize: `${fitInvitationText(el, interpolate(el.text || "", event, guest)) / 4.8}cqw`,
              fontFamily: invitationFont(el.fontFamily),
              textAlign: el.align,
              transform: `rotate(${el.rotation}deg)`,
              transformOrigin: "top left",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              lineHeight: 1.15,
              overflow: "hidden",
            }}
          >
            {el.type === "image" ? (
              <img
                src={el.src}
                loading={mini ? "lazy" : "eager"}
                decoding="async"
                alt={uiText("ui.291d097fdb5b")}
                style={
                  el.crop
                    ? {
                        position: "absolute",
                        width: `${10000 / el.crop.width}%`,
                        height: `${10000 / el.crop.height}%`,
                        left: `${(-el.crop.x / el.crop.width) * 100}%`,
                        top: `${(-el.crop.y / el.crop.height) * 100}%`,
                        maxWidth: "none",
                        objectFit: "fill",
                      }
                    : { width: "100%", height: "100%", objectFit: "fill" }
                }
              />
            ) : el.type === "text" ? (
              interpolate(el.text || "", event, guest)
            ) : null}
          </div>
        ))}
        {!design.decorated && <div className="card-border" />}
      </div>
    </div>
  );
}
