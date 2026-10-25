import { uiText } from "../i18n/uiText";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Plus, Upload, ArrowUpRight } from "lucide-react";
import { addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { favoriteTemplate } from "../services/templatePreferenceService";
import { categories } from "../services/templateService";
import { useTemplates } from "../hooks/useTemplates";
import { DesignPreview } from "../components/invitations/DesignPreview";
import { Modal } from "../components/ui/Modal";
import { uploadImage } from "../services/uploadService";
import { tenantCollection } from "../firebase/firestore";
import { toast } from "sonner";
import { errorMessage } from "../utils";
function isDarkPalette(color: string) {
  const hex = color.replace("#", "");
  const expanded =
    hex.length === 3 ? [...hex].map((value) => value + value).join("") : hex;
  const value = parseInt(expanded, 16);
  return (
    0.2126 * ((value >> 16) & 255) +
      0.7152 * ((value >> 8) & 255) +
      0.0722 * (value & 255) <
    140
  );
}
export default function Templates() {
  const templates = useTemplates();
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sort, setSort] = useState("catalog");
  const [color, setColor] = useState("all");
  const [style, setStyle] = useState("all");
  useEffect(
    () =>
      onSnapshot(
        tenantCollection("templatePreferences"),
        (rows) =>
          setFavorites(
            rows.docs.filter((d) => d.data().favorite).map((d) => d.id),
          ),
        (e) => toast.error(errorMessage(e)),
      ),
    [],
  );

  const [category, setCategory] = useState("All designs");
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const selected = templates.find((t) => t.id === preview);
  const example = {
    title: "A beautiful occasion",
    hostName: "your favorite people",
    eventDate: "December 15, 2026",
    eventTime: "5:00 PM",
    venueName: "Somewhere wonderful",
    venueAddress: "Garden Lane · Colombo",
    message: uiText("ui.78737181ea97"),
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{uiText("ui.04231ec47118")}</span>
          <h1>{uiText("ui.2e82535c2853")}</h1>
          <p>{uiText("ui.f000baa0deb2")}</p>
        </div>
        <button
          className="button outline"
          disabled={busy}
          onClick={() => upload.current?.click()}
        >
          <Upload size={16} />
          {busy ? uiText("ui.5ce44dd77dae") : uiText("ui.c2662b3a128e")}
        </button>
        <input
          ref={upload}
          hidden
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            try {
              const image = await uploadImage(file);
              await addDoc(tenantCollection("templates"), {
                name: file.name.replace(/\.[^.]+$/, ""),
                category: "General Invitation",
                backgroundUrl: image.url,
                storagePath: image.path,
                design: {
                  background: "#ffffff",
                  elements: [
                    {
                      id: crypto.randomUUID(),
                      type: "image",
                      src: image.url,
                      x: 0,
                      y: 0,
                      width: 480,
                      height: 720,
                      fill: "#ffffff",
                      fontSize: 20,
                      fontFamily: "Arial",
                      align: "center",
                      rotation: 0,
                    },
                  ],
                },
                createdAt: serverTimestamp(),
              });
              toast.success(uiText("ui.f049756cfc57"));
            } catch (err) {
              toast.error(errorMessage(err));
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
      </div>
      <div className="template-intro">
        <span>✳</span>
        <p>
          {uiText("ui.b2db92661afc")}
          <br />
          <strong>{uiText("ui.113fdce7a96e")}</strong>
        </p>
      </div>
      <div className="category-tabs">
        {["All designs", ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={category === c ? "active" : ""}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="upgrade-controls">
        <label>
          {uiText("ui.04b9835b977e")}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={uiText("ui.8c63167e0f4a")}
          />
        </label>
        <label>
          {uiText("ui.6b73191a0a4b")}
          <select value={color} onChange={(e) => setColor(e.target.value)}>
            <option value="all">{uiText("ui.dddce8fd2176")}</option>
            <option value="light">{uiText("ui.8f67196bc3d5")}</option>
            <option value="dark">{uiText("ui.f28b1a6caa87")}</option>
          </select>
        </label>
        <label>
          {uiText("ui.7e744141b40e")}
          <select value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="all">{uiText("ui.7009bdcf113b")}</option>
            <option value="illustrated">{uiText("ui.a60ef685b2ed")}</option>
            <option value="custom">{uiText("ui.e2f8e3586a17")}</option>
          </select>
        </label>
        <label>
          {uiText("ui.bec69036aa27")}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="catalog">{uiText("ui.250eee8ed574")}</option>
            <option value="name">{uiText("common.name")}</option>
            <option value="recent">{uiText("ui.b954abdce984")}</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={onlyFavorites}
            onChange={(e) => setOnlyFavorites(e.target.checked)}
          />
          {uiText("ui.3033ce280484")}
        </label>
      </div>
      <div className="template-grid">
        {templates
          .filter(
            (t) =>
              (category === "All designs" || t.category === category) &&
              (!onlyFavorites || favorites.includes(t.id)) &&
              `${t.name} ${t.category}`
                .toLowerCase()
                .includes(search.toLowerCase()) &&
              (style === "all" ||
                (style === "illustrated"
                  ? t.design.decorated
                  : !!t.createdAt)) &&
              (color === "all" ||
                (color === "dark"
                  ? isDarkPalette(t.design.background)
                  : !isDarkPalette(t.design.background))),
          )
          .sort((a, b) =>
            sort === "name"
              ? a.name.localeCompare(b.name)
              : sort === "recent"
                ? (b.createdAt?.toMillis() || 0) -
                  (a.createdAt?.toMillis() || 0)
                : 0,
          )
          .map((t) => (
            <article className="template-card" key={t.id}>
              <div className="template-art">
                <DesignPreview design={t.design} event={example} mini />
                <button
                  className="preview-circle"
                  aria-label={uiText("ui.128b618dc412", {
                    value0: String(t.name),
                  })}
                  onClick={() => setPreview(t.id)}
                >
                  <Eye size={18} />
                </button>
              </div>
              <div className="template-info">
                <div>
                  <h3>{t.name}</h3>
                  <p>{t.category}</p>
                </div>
                <button
                  className="icon-button"
                  aria-label={uiText("ui.58f72e4aa68c", {
                    value0: String(t.name),
                  })}
                  onClick={() => navigate(`/invitations/new?template=${t.id}`)}
                >
                  <ArrowUpRight size={21} />
                </button>
              </div>
              <div className="template-extra-actions">
                <button
                  className="button outline small"
                  aria-pressed={favorites.includes(t.id)}
                  onClick={() =>
                    favoriteTemplate(t.id, !favorites.includes(t.id)).catch(
                      (e) => toast.error(errorMessage(e)),
                    )
                  }
                >
                  {favorites.includes(t.id)
                    ? uiText("ui.5e87a7bd5a63")
                    : uiText("ui.ea713ecd8537")}
                </button>
                <button
                  className="button outline small"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await addDoc(tenantCollection("templates"), {
                        name: `${t.name} copy`,
                        category: t.category,
                        design: { ...structuredClone(t.design), version: 1 },
                        sourceTemplateId: t.id,
                        version: 1,
                        createdAt: serverTimestamp(),
                      });
                      toast.success(uiText("ui.4abe2e057252"));
                    } catch (e) {
                      toast.error(errorMessage(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {uiText("ui.5779f32fab00")}
                </button>
              </div>
              <button
                className="button outline full"
                onClick={() => navigate(`/invitations/new?template=${t.id}`)}
              >
                <Plus size={15} />
                {uiText("ui.351dd54e5327")}
              </button>
            </article>
          ))}
      </div>
      {selected && (
        <Modal title={selected.name} onClose={() => setPreview("")}>
          <div className="modal-preview">
            <DesignPreview design={selected.design} event={example} />
          </div>
          <button
            className="button primary full"
            onClick={() => navigate(`/invitations/new?template=${selected.id}`)}
          >
            {uiText("ui.f949ac35d5e2")}
            <ArrowUpRight size={16} />
          </button>
        </Modal>
      )}
    </>
  );
}
