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
      <div className="design-inner" style={{ background: design.background }}>
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
              background: el.type === "rect" ? el.fill : undefined,
              fontSize: `${el.fontSize / 4.8}cqw`,
              fontFamily: el.fontFamily,
              textAlign: el.align,
              transform: `rotate(${el.rotation}deg)`,
              whiteSpace: "pre-wrap",
              lineHeight: 1.15,
              overflow: "hidden",
            }}
          >
            {el.type === "image" ? (
              <img
                src={el.src}
                alt="Invitation artwork"
                style={{ width: "100%", height: "100%", objectFit: "fill" }}
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
