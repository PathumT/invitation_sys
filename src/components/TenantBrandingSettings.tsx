import { uiText } from "../i18n/uiText";
import { useEffect, useState } from "react";
import { getDoc, updateDoc } from "firebase/firestore";
import { tenantDocument } from "../firebase/firestore";
import { uploadImage } from "../services/uploadService";
import {
  defaultTenantBrand,
  tenantBrandError,
  type TenantBrand,
} from "../utils/tenantBrand";
import { errorMessage } from "../utils";
import { toast } from "sonner";
export function TenantBrandingSettings() {
  const [brand, setBrand] = useState<TenantBrand>(defaultTenantBrand),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    getDoc(tenantDocument())
      .then((snapshot) => {
        if (active) {
          setBrand({ ...defaultTenantBrand, ...snapshot.data()?.branding });
          setReady(true);
        }
      })
      .catch((err) => toast.error(errorMessage(err)));
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="panel settings-panel">
      <div className="panel-heading">
        <div>
          <h2>{uiText("ui.a7b0d1e64c5c")}</h2>
          <p>{uiText("ui.0b17b1a2303d")}</p>
        </div>
      </div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const issue = tenantBrandError(brand);
          if (issue) {
            toast.error(issue);
            return;
          }
          setBusy(true);
          try {
            await updateDoc(tenantDocument(), { branding: brand });
            toast.success(uiText("ui.ba5f281a6051"));
          } catch (err) {
            toast.error(errorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset
          className="form-content branding-fields"
          disabled={busy || !ready}
        >
          <label>
            {uiText("ui.8d540410fa30")}
            <input
              maxLength={160}
              required
              value={brand.displayName}
              onChange={(event) =>
                setBrand({ ...brand, displayName: event.target.value })
              }
            />
          </label>
          <label>
            {uiText("ui.80d90ef1d26e")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                setBusy(true);
                try {
                  const image = await uploadImage(file, undefined, true);
                  setBrand((current) => ({ ...current, logoUrl: image.url }));
                } catch (err) {
                  toast.error(errorMessage(err));
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          {brand.logoUrl && (
            <>
              <img
                src={brand.logoUrl}
                alt={uiText("ui.fdc6c0fa440b")}
                className="workspace-logo-preview"
              />
              <button
                className="button outline small"
                type="button"
                onClick={() => setBrand({ ...brand, logoUrl: "" })}
              >
                {uiText("ui.8ad2aee7137e")}
              </button>
            </>
          )}
          <div className="form-grid">
            <label>
              {uiText("ui.3c0600d53769")}
              <input
                type="color"
                value={brand.primaryColor}
                onChange={(event) =>
                  setBrand({ ...brand, primaryColor: event.target.value })
                }
              />
            </label>
            <label>
              {uiText("ui.b8846849a451")}
              <input
                type="color"
                value={brand.accentColor}
                onChange={(event) =>
                  setBrand({ ...brand, accentColor: event.target.value })
                }
              />
            </label>
          </div>
          <label>
            {uiText("ui.25d4cf0610d3")}
            <input
              maxLength={160}
              value={brand.footerText}
              onChange={(event) =>
                setBrand({ ...brand, footerText: event.target.value })
              }
            />
          </label>
          <button className="button primary" type="submit">
            {uiText("ui.af8afa1c245e")}
          </button>
          <button
            className="button outline"
            type="button"
            onClick={() => setBrand(defaultTenantBrand)}
          >
            {uiText("ui.4ed0814d315a")}
          </button>
        </fieldset>
      </form>
    </section>
  );
}
