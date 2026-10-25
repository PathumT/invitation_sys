import { uiText } from "../../i18n/uiText";
import { invitationFont } from "../../utils/invitationFont";
import {
  saveDesignVersion,
  listDesignVersions,
} from "../../services/designVersionService";
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
    img.onerror = () => toast.error(uiText("ui.93bab7ea0ef9"));
    img.src = el.src || "";
  }, [el.src]);
  return (
    <KonvaImage
      image={image}
      {...props}
      crop={
        el.crop && image
          ? {
              x: (image.width * el.crop.x) / 100,
              y: (image.height * el.crop.y) / 100,
              width: (image.width * el.crop.width) / 100,
              height: (image.height * el.crop.height) / 100,
            }
          : undefined
      }
    />
  );
}
export function CardEditor({ event }: { event: Invitation }) {
  const { design, set, undo, redo, past, future } = useEditorStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selected = selectedIds[0] || "";
  const setSelected = (id: string) => setSelectedIds(id ? [id] : []);
  const [zoom, setZoom] = useState(1);
  const [snap, setSnap] = useState(true);
  const [guides, setGuides] = useState(true);
  const [guideLines, setGuideLines] = useState<{ x?: number; y?: number }>({});
  const [resolution, setResolution] = useState(2);
  const [versions, setVersions] = useState<
    Awaited<ReturnType<typeof listDesignVersions>>
  >([]);
  const [versionBusy, setVersionBusy] = useState(false);
  const dragStart = useRef<Record<string, { x: number; y: number }>>({});

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
    tr.current.nodes(
      selectedIds
        .filter((id) => !design.elements.find((item) => item.id === id)?.locked)
        .map((id) => stage.current!.findOne(`#${id}`))
        .filter((node): node is Konva.Node => !!node),
    );
    tr.current.getLayer()?.batchDraw();
  }, [selectedIds, design]);
  const patch = (id: string, values: Partial<DesignElement>) =>
    set({
      ...useEditorStore.getState().design,
      elements: useEditorStore
        .getState()
        .design.elements.map((e) => (e.id === id ? { ...e, ...values } : e)),
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
  function choose(id: string, multiple = false) {
    const element = design.elements.find((e) => e.id === id);
    const ids = element?.groupId
      ? design.elements
          .filter((e) => e.groupId === element.groupId)
          .map((e) => e.id)
      : [id];
    setSelectedIds((current) =>
      multiple
        ? current.includes(id)
          ? current.filter((value) => !ids.includes(value))
          : [...new Set([...current, ...ids])]
        : ids,
    );
  }
  function modifySelection(
    action: "duplicate" | "remove" | "lock" | "group" | "ungroup" | "center",
  ) {
    const current = useEditorStore.getState().design;
    const ids = selectedIds;
    if (action === "duplicate") {
      const copy = current.elements
        .filter((e) => ids.includes(e.id))
        .map((e) => ({
          ...structuredClone(e),
          id: `e${crypto.randomUUID()}`,
          x: e.x + 12,
          y: e.y + 12,
          locked: false,
          groupId: undefined,
        }));
      const cleaned = copy.map(({ groupId: _group, ...item }) => item);
      set({ ...current, elements: [...current.elements, ...cleaned] });
      setSelectedIds(cleaned.map((e) => e.id));
      return;
    }
    const group = `g${crypto.randomUUID()}`;
    set({
      ...current,
      elements: current.elements
        .filter(
          (e) => !(action === "remove" && ids.includes(e.id) && !e.locked),
        )
        .map((e) =>
          !ids.includes(e.id)
            ? e
            : action === "lock"
              ? { ...e, locked: !e.locked }
              : action === "group"
                ? { ...e, groupId: group }
                : action === "ungroup"
                  ? (Object.fromEntries(
                      Object.entries(e).filter(([key]) => key !== "groupId"),
                    ) as DesignElement)
                  : action === "center" && !e.locked
                    ? { ...e, x: (480 - e.width) / 2 }
                    : e,
        ),
    });
    if (action === "remove") setSelected("");
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        (event.target as HTMLElement).closest(
          "input,textarea,select,[contenteditable=true]",
        )
      )
        return;
      if (event.metaKey || event.ctrlKey) {
        if (event.key.toLowerCase() === "z") {
          event.preventDefault();
          if (event.shiftKey) redo();
          else undo();
        }
        if (event.key.toLowerCase() === "d") {
          event.preventDefault();
          modifySelection("duplicate");
        }
      } else if (
        ["Delete", "Backspace"].includes(event.key) &&
        selectedIds.length
      ) {
        event.preventDefault();
        modifySelection("remove");
      } else if (event.key === "Escape") setSelected("");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  async function exportDesign(format: "png" | "jpeg" | "pdf" = "png") {
    try {
      await document.fonts.ready;
      tr.current?.nodes([]);
      const mime = format === "jpeg" ? "image/jpeg" : "image/png";
      const guidesToHide = stage.current!.find(".export-guide");
      guidesToHide.forEach((node) => node.hide());
      const url = stage.current!.toDataURL({
        pixelRatio: resolution / ((width * zoom) / 480),
        mimeType: mime,
        quality: 0.95,
      });
      guidesToHide.forEach((node) => node.show());
      if (format === "pdf") {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [120, 180],
        });
        pdf.addImage(url, "PNG", 0, 0, 120, 180);
        if (event.id && event.status === "published") {
          const [{ ensurePublicLink }, { shareUrl }, qr] = await Promise.all([
            import("../../services/publicLinkService"),
            import("../../utils"),
            import("qrcode"),
          ]);
          const link = shareUrl(await ensurePublicLink(event), event.hostName);
          const code = await qr.toDataURL(link, { width: 1024, margin: 4 });
          pdf.addPage([120, 180]);
          pdf.setFontSize(11);
          pdf.text("Scan to view the invitation and RSVP", 60, 30, {
            align: "center",
          });
          pdf.addImage(code, "PNG", 15, 45, 90, 90);
        }
        pdf.save(`${event.title || "invitation"}.pdf`);
      } else {
        const link = document.createElement("a");
        link.download = `${event.title || "invitation"}.${format === "jpeg" ? "jpg" : "png"}`;
        link.href = url;
        link.click();
      }
      setSelected("");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      stage.current?.find(".export-guide").forEach((node) => node.show());
    }
  }
  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        <div>
          <button onClick={() => add("text")} className="button outline small">
            <Type size={16} />
            {uiText("ui.71988c4d8e08")}
          </button>
          <button onClick={() => add("rect")} className="button outline small">
            <Square size={16} />
            {uiText("ui.e0e492707f85")}
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
            {uploading ? uiText("ui.5ce44dd77dae") : uiText("ui.1aa4cb0bcca7")}
          </button>
        </div>
        <div>
          <button
            className="icon-button"
            aria-label={uiText("ui.a8283ade3185")}
            disabled={!past.length}
            onClick={undo}
          >
            <Undo2 size={18} />
          </button>
          <button
            className="icon-button"
            aria-label={uiText("ui.74273989b096")}
            disabled={!future.length}
            onClick={redo}
          >
            <Redo2 size={18} />
          </button>
          <button
            className="button outline small"
            onClick={() => exportDesign("png")}
          >
            <Download size={15} />
            {uiText("ui.796120837694")}
          </button>
        </div>
      </div>
      <div className="upgrade-controls editor-upgrade-controls">
        <label>
          {uiText("ui.509c517ede79")}
          <select value={zoom} onChange={(e) => setZoom(+e.target.value)}>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((v) => (
              <option key={v} value={v}>
                {v * 100}%
              </option>
            ))}
          </select>
        </label>
        <label>
          {uiText("ui.c8cf9b8f5efa")}
          <select
            value={resolution}
            onChange={(e) => setResolution(+e.target.value)}
          >
            <option value={1}>{uiText("ui.d1875ad1daec")}</option>
            <option value={2}>{uiText("ui.693f54ef2cf3")}</option>
            <option value={2.25}>{uiText("ui.583339526230")}</option>
            <option value={4}>{uiText("ui.96bf10df9e93")}</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={snap}
            onChange={(e) => setSnap(e.target.checked)}
          />
          {uiText("ui.1ce4ae3c7c81")}
        </label>
        <label>
          <input
            type="checkbox"
            checked={guides}
            onChange={(e) => setGuides(e.target.checked)}
          />
          {uiText("ui.e17aa0b4fe0d")}
        </label>
        <button
          className="button outline small"
          onClick={() => exportDesign("jpeg")}
        >
          {uiText("ui.f4dc1c96a30f")}
        </button>
        <button
          className="button outline small"
          onClick={() => exportDesign("pdf")}
        >
          {uiText("ui.1d393b0081b6")}
        </button>
        <button
          className="button outline small"
          disabled={!selectedIds.length}
          onClick={() => modifySelection("duplicate")}
        >
          {uiText("ui.02cdaabfca80")}
        </button>
        <button
          className="button outline small"
          disabled={!selectedIds.length}
          onClick={() => modifySelection("lock")}
        >
          {uiText("ui.ee03dafd9ac3")}
        </button>
        <button
          className="button outline small"
          disabled={!selectedIds.length}
          onClick={() => modifySelection("center")}
        >
          {uiText("ui.d946067427e9")}
        </button>
        <button
          className="button outline small"
          disabled={selectedIds.length < 2}
          onClick={() => modifySelection("group")}
        >
          {uiText("ui.34ca0e766088")}
        </button>
        <button
          className="button outline small"
          disabled={!selectedIds.length}
          onClick={() => modifySelection("ungroup")}
        >
          {uiText("ui.b57ef478f9ba")}
        </button>
      </div>
      <div className="editor-body">
        <div className="canvas-workspace" ref={wrapper}>
          <Stage
            ref={stage}
            width={width * zoom}
            height={width * zoom * 1.5}
            scaleX={(width * zoom) / 480}
            scaleY={(width * zoom) / 480}
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
                fillPriority={design.gradient ? "linear-gradient" : "color"}
                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                fillLinearGradientEndPoint={{ x: 480, y: 720 }}
                fillLinearGradientColorStops={
                  design.gradient
                    ? [0, design.gradient.start, 1, design.gradient.end]
                    : undefined
                }
                onTap={() => setSelected("")}
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
                  draggable: !e.locked,
                  opacity: e.opacity ?? 1,
                  shadowColor: e.shadowColor,
                  shadowBlur: e.shadowBlur || 0,
                  shadowOffsetX: e.shadowOffsetX || 0,
                  shadowOffsetY: e.shadowOffsetY || 0,
                  onClick: (evt: any) => choose(e.id, evt.evt.shiftKey),
                  onTap: () => choose(e.id),
                  onDragStart: () => {
                    const dragIds = selectedIds.includes(e.id)
                      ? selectedIds
                      : design.elements
                          .filter(
                            (item) =>
                              item.id === e.id ||
                              (e.groupId && item.groupId === e.groupId),
                          )
                          .map((item) => item.id);
                    setSelectedIds(dragIds);
                    dragStart.current = Object.fromEntries(
                      design.elements
                        .filter(
                          (item) => dragIds.includes(item.id) && !item.locked,
                        )
                        .map((item) => [item.id, { x: item.x, y: item.y }]),
                    );
                  },
                  onDragMove: (evt: any) => {
                    const node = evt.target;
                    let x = node.x(),
                      y = node.y();
                    const centeredX = (480 - e.width) / 2,
                      centeredY = (720 - e.height) / 2;
                    const nearX = Math.abs(x - centeredX) < 8,
                      nearY = Math.abs(y - centeredY) < 8;
                    if (snap) {
                      x = nearX ? centeredX : Math.round(x / 10) * 10;
                      y = nearY ? centeredY : Math.round(y / 10) * 10;
                      node.position({ x, y });
                    }
                    setGuideLines({
                      ...(nearX ? { x: 240 } : {}),
                      ...(nearY ? { y: 360 } : {}),
                    });
                    const start = dragStart.current[e.id];
                    if (start)
                      for (const id of Object.keys(dragStart.current)) {
                        if (id === e.id) continue;
                        const other = stage.current?.findOne(`#${id}`);
                        const original = dragStart.current[id];
                        if (
                          other &&
                          original &&
                          !design.elements.find((item) => item.id === id)
                            ?.locked
                        )
                          other.position({
                            x: original.x + x - start.x,
                            y: original.y + y - start.y,
                          });
                      }
                  },
                  onDragEnd: () => {
                    setGuideLines({});
                    const latest = useEditorStore.getState().design;
                    set({
                      ...latest,
                      elements: latest.elements.map((item) => {
                        const node = stage.current?.findOne(`#${item.id}`);
                        return node &&
                          Object.hasOwn(dragStart.current, item.id) &&
                          !item.locked
                          ? { ...item, x: node.x(), y: node.y() }
                          : item;
                      }),
                    });
                  },
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
                    fontFamily={invitationFont(e.fontFamily)}
                    align={e.align}
                  />
                );
              })}
              {guides && (
                <Rect
                  name="export-guide"
                  x={18}
                  y={18}
                  width={444}
                  height={684}
                  stroke="#b48b43"
                  dash={[6, 6]}
                  strokeWidth={1}
                  listening={false}
                />
              )}
              {guides && guideLines.x !== undefined && (
                <Rect
                  name="export-guide"
                  x={239.5}
                  y={0}
                  width={1}
                  height={720}
                  fill="#c58b3e"
                  listening={false}
                />
              )}
              {guides && guideLines.y !== undefined && (
                <Rect
                  name="export-guide"
                  x={0}
                  y={359.5}
                  width={480}
                  height={1}
                  fill="#c58b3e"
                  listening={false}
                />
              )}
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
          <span className="eyebrow">{uiText("ui.85dfdceb0405")}</span>
          <h3>{el ? uiText("ui.6d59bda00d70") : uiText("ui.6de94b8da3df")}</h3>
          {el ? (
            <>
              <label>
                {el.type === "text"
                  ? uiText("ui.c24623502a05")
                  : uiText("ui.51b561cbca71")}
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
                    {uiText("ui.64d0b3adcd2d")}
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
                        "Noto Sans Sinhala",
                        "Noto Sans Tamil",
                        "Nirmala UI",
                        "Impact",
                        "Arial Black",
                      ].map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </label>
                  <div className="form-row">
                    <label>
                      {uiText("ui.1af851907331")}
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
                      {uiText("ui.6b73191a0a4b")}
                      <input
                        type="color"
                        value={el.fill}
                        onChange={(e) => patch(el.id, { fill: e.target.value })}
                      />
                    </label>
                  </div>
                  <label>
                    {uiText("ui.9d597870c4b3")}
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
                  {uiText("ui.6b73191a0a4b")}
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
                  {uiText("ui.f1c65e14817e")}
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
                  {uiText("ui.76900f1bfd16")}
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
                  {uiText("ui.c3812fc4acb8")}
                </button>
              </div>
            </>
          ) : (
            <p className="muted">{uiText("ui.039236556ece")}</p>
          )}
          <hr />
          <h3>{uiText("ui.0bcd66e677f4")}</h3>
          <div className="editor-layer-list">
            {[...design.elements].reverse().map((item) => (
              <button
                key={item.id}
                className="button outline small"
                aria-pressed={selectedIds.includes(item.id)}
                onClick={(e) => choose(item.id, e.shiftKey)}
              >
                {item.locked ? uiText("ui.25c7e4a79549") : ""}
                {item.text?.slice(0, 28) || item.type}
              </button>
            ))}
          </div>
          {el && (
            <>
              <label>
                {uiText("ui.6062652e10dd")}
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={el.opacity ?? 1}
                  onChange={(e) => patch(el.id, { opacity: +e.target.value })}
                />
              </label>
              <label>
                {uiText("ui.81e2329fa5ae")}
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={el.shadowBlur || 0}
                  onChange={(e) =>
                    patch(el.id, {
                      shadowBlur: Math.max(0, Math.min(30, +e.target.value)),
                      shadowColor: "#000000",
                      shadowOffsetY: 2,
                    })
                  }
                />
              </label>
              {el.type === "image" && (
                <fieldset>
                  <legend>{uiText("ui.fe1a77cadd77")}</legend>
                  {(["x", "y", "width", "height"] as const).map((key) => (
                    <label key={key}>
                      {uiText("ui.8bff3d46a667", { value0: String(key) })}
                      <input
                        type="number"
                        min={key === "width" || key === "height" ? 1 : 0}
                        max={100}
                        value={
                          el.crop?.[key] ??
                          (key === "width" || key === "height" ? 100 : 0)
                        }
                        onChange={(e) => {
                          const crop = {
                            x: 0,
                            y: 0,
                            width: 100,
                            height: 100,
                            ...el.crop,
                            [key]: Math.max(
                              0,
                              Math.min(
                                key === "x" || key === "y" ? 99 : 100,
                                +e.target.value,
                              ),
                            ),
                          };
                          crop.width = Math.max(
                            1,
                            Math.min(crop.width, 100 - crop.x),
                          );
                          crop.height = Math.max(
                            1,
                            Math.min(crop.height, 100 - crop.y),
                          );
                          patch(el.id, { crop });
                        }}
                      />
                    </label>
                  ))}
                </fieldset>
              )}
            </>
          )}
          <h3>{uiText("ui.203c4c9b5abc")}</h3>
          <p className="helper">{uiText("ui.983ee369eec2")}</p>
          <button
            className="button outline small"
            disabled={!event.id || versionBusy}
            onClick={async () => {
              setVersionBusy(true);
              try {
                await saveDesignVersion(event.id, design);
                setVersions(await listDesignVersions(event.id));
                toast.success(uiText("ui.9a7f8df424a6"));
              } catch (e) {
                toast.error(errorMessage(e));
              } finally {
                setVersionBusy(false);
              }
            }}
          >
            {uiText("ui.b1b159bc646a")}
          </button>
          <button
            className="button outline small"
            disabled={!event.id || versionBusy}
            onClick={async () => {
              setVersionBusy(true);
              try {
                setVersions(await listDesignVersions(event.id));
              } catch (e) {
                toast.error(errorMessage(e));
              } finally {
                setVersionBusy(false);
              }
            }}
          >
            {uiText("ui.9a9b1c99b60c")}
          </button>
          {versions.map((version) => (
            <button
              key={version.id}
              className="button outline small"
              onClick={() => {
                if (
                  window.confirm(
                    "Restore this design checkpoint? Current edits remain available through Undo.",
                  )
                ) {
                  set(version.design);
                  setSelected("");
                }
              }}
            >
              {uiText("ui.a76e13b98392")}{" "}
              {version.createdAt?.toDate().toLocaleString() || "saved version"}
            </button>
          ))}
          <label>
            {uiText("ui.571f169ade11")}
            <input
              type="checkbox"
              checked={!!design.gradient}
              onChange={(e) => {
                if (e.target.checked)
                  set({
                    ...design,
                    gradient: { start: design.background, end: "#ffffff" },
                  });
                else {
                  const rest = { ...design };
                  delete rest.gradient;
                  set(rest);
                }
              }}
            />
          </label>
          {design.gradient && (
            <label>
              {uiText("ui.36670c89ef35")}
              <input
                type="color"
                value={design.gradient.end}
                onChange={(e) =>
                  set({
                    ...design,
                    gradient: { ...design.gradient!, end: e.target.value },
                  })
                }
              />
            </label>
          )}
          <label>
            {uiText("ui.3e314dafdf7c")}
            <input
              type="color"
              value={design.background}
              onChange={(e) =>
                set({
                  ...design,
                  background: e.target.value,
                  ...(design.gradient
                    ? {
                        gradient: { ...design.gradient, start: e.target.value },
                      }
                    : {}),
                })
              }
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
            {uiText("ui.32fc8e0014fa")}
          </button>
          <small className="variable-help">
            {uiText("ui.0f33e1e6b462")}
            <br />
            {uiText("ui.391ce586da48")}
            <br />
            {uiText("ui.9cce49656ce7")}
            <br />
            {uiText("ui.f1a8bceaf84a")}
            <br />
            {uiText("ui.2a91539c1db8")}
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
            toast.success(uiText("ui.0913bc0b9907"));
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
