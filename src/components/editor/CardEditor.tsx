import { useState, useEffect, useRef } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import Konva from "konva";
import {
  Type,
  Square,
  ImagePlus,
  Undo2,
  Redo2,
  Download,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useEditorStore } from "../../hooks/editorStore";
import { interpolate, errorMessage } from "../../utils";
import { uploadImage } from "../../services/uploadService";
import type { DesignElement, Invitation } from "../../types";
import { toast } from "sonner";
function CanvasImage({
  el,
  ...props
}: {
  el: DesignElement;
  [key: string]: any;
}) {
  const [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.onerror = () =>
      toast.error(
        "An image could not load. Check Storage access and CORS configuration.",
      );
    img.src = el.src || "";
  }, [el.src]);
  return <KonvaImage image={image} {...props} />;
}
export function CardEditor({ event }: { event: Invitation }) {
  const { design, set, undo, redo, past, future } = useEditorStore();
  const [selected, setSelected] = useState("");
  const [width, setWidth] = useState(480);
  const [uploading, setUploading] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const stage = useRef<Konva.Stage>(null);
  const tr = useRef<Konva.Transformer>(null);
  const upload = useRef<HTMLInputElement>(null);
  const [backgroundUpload, setBackgroundUpload] = useState(false);
  const el = design.elements.find((e) => e.id === selected);
  useEffect(() => {
    const obs = new ResizeObserver((entries) =>
      setWidth(Math.min(480, entries[0].contentRect.width)),
    );
    if (wrapper.current) obs.observe(wrapper.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!tr.current || !stage.current) return;
    const node = stage.current.findOne(`#${selected}`);
    tr.current.nodes(node ? [node] : []);
    tr.current.getLayer()?.batchDraw();
  }, [selected, design]);
  const patch = (id: string, values: Partial<DesignElement>) =>
    set({
      ...design,
      elements: design.elements.map((e) =>
        e.id === id ? { ...e, ...values } : e,
      ),
    });
  const add = (type: "text" | "rect") => {
    const id = `e${crypto.randomUUID()}`;
    set({
      ...design,
      elements: [
        ...design.elements,
        {
          id,
          type,
          x: 70,
          y: type === "text" ? 112 : 250,
          width: 340,
          height: type === "text" ? 40 : 120,
          text: type === "text" ? "Your beautiful words" : "",
          fill: "#315649",
          fontSize: 28,
          fontFamily: "Georgia",
          align: "center",
          rotation: 0,
        },
      ],
    });
    setSelected(id);
  };
  function exportPNG() {
    try {
      tr.current?.nodes([]);
      const url = stage.current!.toDataURL({ pixelRatio: 2 / (width / 480) });
      const a = document.createElement("a");
      a.download = `${event.title || "invitation"}.png`;
      a.href = url;
      a.click();
      setSelected("");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        <div>
          <button onClick={() => add("text")} className="button outline small">
            <Type size={16} />
            Text
          </button>
          <button onClick={() => add("rect")} className="button outline small">
            <Square size={16} />
            Shape
          </button>
          <button
            disabled={uploading}
            onClick={() => {
              setBackgroundUpload(false);
              upload.current?.click();
            }}
            className="button outline small"
          >
            <ImagePlus size={16} />
            {uploading ? "Uploading…" : "Image"}
          </button>
        </div>
        <div>
          <button
            className="icon-button"
            aria-label="Undo"
            disabled={!past.length}
            onClick={undo}
          >
            <Undo2 size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Redo"
            disabled={!future.length}
            onClick={redo}
          >
            <Redo2 size={18} />
          </button>
          <button className="button outline small" onClick={exportPNG}>
            <Download size={15} />
            PNG
          </button>
        </div>
      </div>
      <div className="editor-body">
        <div className="canvas-workspace" ref={wrapper}>
          <Stage
            ref={stage}
            width={width}
            height={width * 1.5}
            scaleX={width / 480}
            scaleY={width / 480}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) setSelected("");
            }}
          >
            <Layer>
              <Rect
                x={0}
                y={0}
                width={480}
                height={720}
                fill={design.background}
                onClick={() => setSelected("")}
              />
              {design.elements.map((e) => {
                const props = {
                  id: e.id,
                  key: e.id,
                  x: e.x,
                  y: e.y,
                  width: e.width,
                  height: e.height,
                  rotation: e.rotation,
                  draggable: true,
                  onClick: () => setSelected(e.id),
                  onTap: () => setSelected(e.id),
                  onDragEnd: (evt: any) =>
                    patch(e.id, { x: evt.target.x(), y: evt.target.y() }),
                  onTransformEnd: (evt: any) => {
                    const n = evt.target;
                    patch(e.id, {
                      x: n.x(),
                      y: n.y(),
                      width: Math.max(15, n.width() * n.scaleX()),
                      height: Math.max(15, n.height() * n.scaleY()),
                      rotation: n.rotation(),
                    });
                    n.scaleX(1);
                    n.scaleY(1);
                  },
                };
                return e.type === "image" ? (
                  <CanvasImage el={e} {...props} />
                ) : e.type === "rect" ? (
                  <Rect {...props} fill={e.fill} />
                ) : (
                  <Text
                    {...props}
                    text={interpolate(e.text || "", event)}
                    fill={e.fill}
                    fontSize={e.fontSize}
                    fontFamily={e.fontFamily}
                    align={e.align}
                  />
                );
              })}
              {!design.decorated && (
                <>
                  <Text
                    text="✳"
                    x={0}
                    y={29}
                    width={480}
                    align="center"
                    fontSize={43}
                    fill="#8d976b"
                    opacity={0.6}
                    listening={false}
                  />
                  <Rect
                    x={14.4}
                    y={21.6}
                    width={451.2}
                    height={676.8}
                    stroke="#89916f2b"
                    strokeWidth={1}
                    listening={false}
                  />
                </>
              )}
              <Transformer
                ref={tr}
                rotateEnabled
                boundBoxFunc={(old, box) =>
                  box.width < 15 || box.height < 15 ? old : box
                }
              />
            </Layer>
          </Stage>
        </div>
        <aside className="editor-properties">
          <span className="eyebrow">YOUR DESIGN DETAILS</span>
          <h3>{el ? "Selected element" : "Make it your own"}</h3>
          {el ? (
            <>
              <label>
                {el.type === "text" ? "Text content" : "Element type"}
                {el.type === "text" ? (
                  <textarea
                    value={el.text}
                    onChange={(e) => patch(el.id, { text: e.target.value })}
                  />
                ) : (
                  <input disabled value={el.type} />
                )}
              </label>
              {el.type === "text" && (
                <>
                  <label>
                    Font
                    <select
                      value={el.fontFamily}
                      onChange={(e) =>
                        patch(el.id, { fontFamily: e.target.value })
                      }
                    >
                      {[
                        "Georgia",
                        "Arial",
                        "Times New Roman",
                        "Verdana",
                        "Courier New",
                        "Impact",
                        "Arial Black",
                      ].map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </label>
                  <div className="form-row">
                    <label>
                      Size
                      <input
                        type="number"
                        min="8"
                        max="160"
                        value={el.fontSize}
                        onChange={(e) =>
                          patch(el.id, { fontSize: +e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Color
                      <input
                        type="color"
                        value={el.fill}
                        onChange={(e) => patch(el.id, { fill: e.target.value })}
                      />
                    </label>
                  </div>
                  <label>
                    Alignment
                    <select
                      value={el.align}
                      onChange={(e) =>
                        patch(el.id, {
                          align: e.target.value as DesignElement["align"],
                        })
                      }
                    >
                      {["left", "center", "right"].map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              {el.type === "rect" && (
                <label>
                  Color
                  <input
                    type="color"
                    value={el.fill}
                    onChange={(e) => patch(el.id, { fill: e.target.value })}
                  />
                </label>
              )}
              <div className="form-row">
                {(["x", "y", "width", "height"] as const).map((key) => (
                  <label key={key}>
                    {key}
                    <input
                      type="number"
                      value={Math.round(el[key])}
                      onChange={(e) => patch(el.id, { [key]: +e.target.value })}
                    />
                  </label>
                ))}
              </div>
              <div className="property-actions">
                <button
                  className="button outline small"
                  onClick={() => {
                    const items = [...design.elements],
                      index = items.findIndex((i) => i.id === el.id);
                    if (index < items.length - 1) {
                      [items[index], items[index + 1]] = [
                        items[index + 1],
                        items[index],
                      ];
                      set({ ...design, elements: items });
                    }
                  }}
                >
                  <ArrowUp size={14} />
                  Forward
                </button>
                <button
                  className="button outline small"
                  onClick={() => {
                    const items = [...design.elements],
                      index = items.findIndex((i) => i.id === el.id);
                    if (index > 0) {
                      [items[index], items[index - 1]] = [
                        items[index - 1],
                        items[index],
                      ];
                      set({ ...design, elements: items });
                    }
                  }}
                >
                  <ArrowDown size={14} />
                  Back
                </button>
                <button
                  className="button outline danger-text small"
                  onClick={() => {
                    set({
                      ...design,
                      elements: design.elements.filter((e) => e.id !== el.id),
                    });
                    setSelected("");
                  }}
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            </>
          ) : (
            <p className="muted">
              Select an element on the canvas to edit it. Drag to move; use the
              handles to resize.
            </p>
          )}
          <hr />
          <label>
            Background color
            <input
              type="color"
              value={design.background}
              onChange={(e) => set({ ...design, background: e.target.value })}
            />
          </label>
          <button
            disabled={uploading}
            className="button outline small full"
            onClick={() => {
              setBackgroundUpload(true);
              upload.current?.click();
            }}
          >
            Upload background
          </button>
          <small className="variable-help">
            Link text to your event with:
            <br />
            {"{{eventTitle}} · {{hostName}}"}
            <br />
            {"{{eventDate}} · {{eventTime}}"}
            <br />
            {"{{venueName}} · {{venueAddress}}"}
            <br />
            {"{{guestName}}"}
          </small>
        </aside>
      </div>
      <input
        ref={upload}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setUploading(true);
          try {
            const media = await uploadImage(file, event.id || undefined);
            const image: DesignElement = {
              id: `e${crypto.randomUUID()}`,
              type: "image",
              x: backgroundUpload ? 0 : 80,
              y: backgroundUpload ? 0 : 180,
              width: backgroundUpload ? 480 : 250,
              height: backgroundUpload ? 720 : 250,
              src: media.url,
              fill: "#ffffff",
              fontSize: 20,
              fontFamily: "Arial",
              align: "center",
              rotation: 0,
            };
            set({
              ...design,
              elements: backgroundUpload
                ? [image, ...design.elements]
                : [...design.elements, image],
            });
            toast.success("Image uploaded.");
          } catch (err) {
            toast.error(errorMessage(err));
          } finally {
            setUploading(false);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}
