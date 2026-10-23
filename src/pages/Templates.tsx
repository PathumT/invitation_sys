import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Plus, Upload, ArrowUpRight } from "lucide-react";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { categories } from "../services/templateService";
import { useTemplates } from "../hooks/useTemplates";
import { DesignPreview } from "../components/invitations/DesignPreview";
import { Modal } from "../components/ui/Modal";
import { uploadImage } from "../services/uploadService";
import { tenantCollection } from "../firebase/firestore";
import { toast } from "sonner";
import { errorMessage } from "../utils";
export default function Templates() {
  const templates = useTemplates();
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
    message: "Join us as we celebrate our new opening.",
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">START WITH A LITTLE INSPIRATION</span>
          <h1>A design for every occasion.</h1>
          <p>Thoughtfully made. Endlessly yours. Find your starting point.</p>
        </div>
        <button
          className="button outline"
          disabled={busy}
          onClick={() => upload.current?.click()}
        >
          <Upload size={16} />
          {busy ? "Uploading…" : "Upload your design"}
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
              toast.success("Your private template is ready.");
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
          A little inspiration for your next big moment.
          <br />
          <strong>Every design is a canvas for your story.</strong>
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
      <div className="template-grid">
        {templates
          .filter((t) => category === "All designs" || t.category === category)
          .map((t) => (
            <article className="template-card" key={t.id}>
              <div className="template-art">
                <DesignPreview design={t.design} event={example} mini />
                <button
                  className="preview-circle"
                  aria-label={`Preview ${t.name}`}
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
                  aria-label={`Use ${t.name}`}
                  onClick={() => navigate(`/invitations/new?template=${t.id}`)}
                >
                  <ArrowUpRight size={21} />
                </button>
              </div>
              <button
                className="button outline full"
                onClick={() => navigate(`/invitations/new?template=${t.id}`)}
              >
                <Plus size={15} />
                Use template
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
            Make it yours <ArrowUpRight size={16} />
          </button>
        </Modal>
      )}
    </>
  );
}
