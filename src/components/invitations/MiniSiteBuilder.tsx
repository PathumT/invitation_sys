import { uiText } from "../../i18n/uiText";
import { useState } from "react";
import type { EventMiniSite } from "../../types";
import { initialMiniSite, siteSections } from "../../utils/miniSite";
import { uploadImage } from "../../services/uploadService";
import { errorMessage } from "../../utils";
import { toast } from "sonner";
function EntryList<T extends Record<string, string>>({
  name,
  items,
  columns,
  limit,
  onChange,
}: {
  name: string;
  items: T[];
  columns: { key: keyof T; label: string; multiline?: boolean }[];
  limit: number;
  onChange: (items: T[]) => void;
}) {
  return (
    <fieldset className="site-entry-list">
      <legend>{name}</legend>
      {items.map((item, index) => (
        <div key={index} className="site-entry">
          {columns.map((column) => (
            <label key={String(column.key)}>
              {column.label}
              {column.multiline ? (
                <textarea
                  maxLength={1000}
                  rows={3}
                  value={item[column.key]}
                  onChange={(event) =>
                    onChange(
                      items.map((value, i) =>
                        i === index
                          ? { ...value, [column.key]: event.target.value }
                          : value,
                      ),
                    )
                  }
                />
              ) : (
                <input
                  value={item[column.key]}
                  maxLength={column.key === "url" ? 2048 : 160}
                  onChange={(event) =>
                    onChange(
                      items.map((value, i) =>
                        i === index
                          ? { ...value, [column.key]: event.target.value }
                          : value,
                      ),
                    )
                  }
                />
              )}
            </label>
          ))}
          <button
            className="button outline small"
            type="button"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            {uiText("ui.5948954e3b49")}
            {name.toLowerCase()}
            {uiText("ui.eb769caa2522")}
            {index + 1}
          </button>
        </div>
      ))}
      <button
        className="button outline small"
        type="button"
        disabled={items.length >= limit}
        onClick={() =>
          onChange([
            ...items,
            Object.fromEntries(columns.map((column) => [column.key, ""])) as T,
          ])
        }
      >
        {uiText("ui.8d89e4a829ae")}
        {name.toLowerCase()}
        {uiText("ui.a5f3c2e9f903")}
      </button>
    </fieldset>
  );
}
export function MiniSiteBuilder({
  site,
  eventId,
  onChange,
}: {
  site?: EventMiniSite;
  eventId: string;
  onChange: (value: EventMiniSite) => void;
}) {
  const value = site || initialMiniSite();
  const [busy, setBusy] = useState(false);
  function patch(update: Partial<EventMiniSite>) {
    onChange({ ...value, ...update });
  }
  function move(id: EventMiniSite["sections"][number], direction: number) {
    const items = [...value.sections],
      index = items.indexOf(id),
      target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    patch({ sections: items });
  }
  return (
    <fieldset className="invitation-experience-options" disabled={busy}>
      <legend>{uiText("ui.58b2eeb7fffa")}</legend>
      <label>
        <input
          type="checkbox"
          checked={!!site?.enabled}
          onChange={(event) => patch({ enabled: event.target.checked })}
        />
        {uiText("ui.ff1e047b8a57")}
      </label>
      {site?.enabled && (
        <>
          <p className="helper">{uiText("ui.3ca7d48b0bc5")}</p>
          <div className="form-grid">
            <label>
              {uiText("ui.a8d6c20cdb7a")}
              <input
                type="color"
                value={value.color}
                onChange={(event) => patch({ color: event.target.value })}
              />
            </label>
            <label>
              {uiText("ui.0703162f3784")}
              <input
                type="color"
                value={value.background}
                onChange={(event) => patch({ background: event.target.value })}
              />
            </label>
          </div>
          <label>
            {uiText("ui.3e91fe24c979")}
            <select
              value={value.font}
              onChange={(event) =>
                patch({ font: event.target.value as EventMiniSite["font"] })
              }
            >
              <option value="Georgia">{uiText("ui.9906958b0bdb")}</option>
              <option value="Arial">{uiText("ui.02ae9aa28987")}</option>
              <option value="Trebuchet MS">{uiText("ui.bb38e61e51f8")}</option>
            </select>
          </label>
          <div className="site-section-order">
            {[
              ...value.sections,
              ...siteSections
                .map((section) => section.id)
                .filter((id) => !value.sections.includes(id)),
            ].map((id) => (
              <div key={id}>
                <label>
                  <input
                    type="checkbox"
                    checked={value.sections.includes(id)}
                    onChange={(event) =>
                      patch({
                        sections: event.target.checked
                          ? [...value.sections, id]
                          : value.sections.filter((key) => key !== id),
                      })
                    }
                  />
                  {siteSections.find((section) => section.id === id)?.label}
                </label>
                <button
                  type="button"
                  className="button outline small"
                  aria-label={uiText("ui.b6826e6b528d", { value0: String(id) })}
                  disabled={value.sections.indexOf(id) <= 0}
                  onClick={() => move(id, -1)}
                >
                  {uiText("ui.55490a4bf3a8")}
                </button>
                <button
                  type="button"
                  className="button outline small"
                  aria-label={uiText("ui.1802f67e277e", { value0: String(id) })}
                  disabled={
                    !value.sections.includes(id) ||
                    value.sections.indexOf(id) === value.sections.length - 1
                  }
                  onClick={() => move(id, 1)}
                >
                  {uiText("ui.b86d11af7918")}
                </button>
              </div>
            ))}
          </div>
          <EntryList
            name="Schedule"
            items={value.schedule}
            limit={20}
            columns={[
              { key: "time", label: "Schedule time" },
              { key: "title", label: "Schedule activity" },
            ]}
            onChange={(schedule) => patch({ schedule })}
          />
          <fieldset className="site-entry-list">
            <legend>{uiText("ui.83185eb03074")}</legend>
            <p className="helper">{uiText("ui.d8cd955af9b0")}</p>
            <label>
              {uiText("ui.8546e95d5543")}
              <select
                value={value.galleryLayout || "grid"}
                onChange={(event) =>
                  patch({
                    galleryLayout: event.target.value as "grid" | "masonry",
                  })
                }
              >
                <option value="grid">{uiText("ui.0e60e831f2c6")}</option>
                <option value="masonry">{uiText("ui.246a1d588fa1")}</option>
              </select>
            </label>
            {value.photos.map((photo, index) => (
              <div key={index} className="site-entry">
                <img
                  src={photo.url}
                  alt={uiText("ui.23eb6f682aac")}
                  width={100}
                  height={75}
                />
                <label>
                  <input
                    type="checkbox"
                    checked={photo.visibility !== "private"}
                    onChange={(event) =>
                      patch({
                        photos: value.photos.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                visibility: event.target.checked
                                  ? "public"
                                  : "private",
                              }
                            : item,
                        ),
                      })
                    }
                  />
                  {uiText("ui.d7d7467971af")}
                  {index + 1}
                </label>
                <label>
                  {uiText("ui.bad132b9f355")}
                  <input
                    maxLength={160}
                    value={photo.caption}
                    onChange={(event) =>
                      patch({
                        photos: value.photos.map((item, i) =>
                          i === index
                            ? { ...item, caption: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  className="button outline small"
                  type="button"
                  onClick={() =>
                    patch({
                      photos: value.photos.filter((_, i) => i !== index),
                    })
                  }
                >
                  {uiText("ui.3c5bba393243")}
                  {index + 1}
                </button>
              </div>
            ))}
            <label>
              {uiText("ui.65d439a5689c")}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={!eventId || value.photos.length >= 12}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  setBusy(true);
                  try {
                    const image = await uploadImage(file, eventId, true);
                    patch({
                      photos: [
                        ...value.photos,
                        { url: image.url, caption: "" },
                      ],
                    });
                  } catch (err) {
                    toast.error(errorMessage(err));
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </label>
            {!eventId && <p className="helper">{uiText("ui.4f3b835ea111")}</p>}
          </fieldset>
          <label>
            {uiText("ui.9af6b95d09d2")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={!eventId}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                setBusy(true);
                try {
                  const image = await uploadImage(file, eventId, true);
                  patch({ backgroundImage: image.url });
                } catch (err) {
                  toast.error(errorMessage(err));
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          {value.backgroundImage && (
            <button
              className="button outline small"
              type="button"
              onClick={() => patch({ backgroundImage: "" })}
            >
              {uiText("ui.bf5b700aeb06")}
            </button>
          )}
          <EntryList
            name="Videos"
            items={value.videos}
            limit={6}
            columns={[
              { key: "title", label: "Video title" },
              { key: "url", label: "YouTube or Vimeo link" },
            ]}
            onChange={(videos) => patch({ videos })}
          />
          <EntryList
            name="Registry"
            items={value.registry}
            limit={10}
            columns={[
              { key: "title", label: "Registry name" },
              { key: "url", label: "Registry website" },
            ]}
            onChange={(registry) => patch({ registry })}
          />
          <EntryList
            name="FAQ"
            items={value.faq}
            limit={10}
            columns={[
              { key: "question", label: "FAQ question" },
              { key: "answer", label: "FAQ answer", multiline: true },
            ]}
            onChange={(faq) => patch({ faq })}
          />
          <label>
            {uiText("ui.5750bf358db2")}
            <textarea
              maxLength={1000}
              value={value.closing}
              onChange={(event) => patch({ closing: event.target.value })}
            />
          </label>
        </>
      )}
    </fieldset>
  );
}
