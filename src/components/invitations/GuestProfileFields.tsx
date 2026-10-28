import { uiText } from "../../i18n/uiText";
import type { Guest } from "../../types";
import { guestCategories } from "../../utils/guestProfile";
export function GuestProfileFields({
  guest,
  onChange,
}: {
  guest: Partial<Guest>;
  onChange: (guest: Partial<Guest>) => void;
}) {
  return (
    <details className="private-guest-details">
      <summary>{uiText("ui.7664e8c43fe8")}</summary>
      <p className="helper">{uiText("ui.32dfa35659bc")}</p>
      <div className="form-grid">
        <label>
          {uiText("ui.702ef921ed1d")}
          <input
            maxLength={160}
            value={guest.firstName || ""}
            onChange={(event) =>
              onChange({ ...guest, firstName: event.target.value })
            }
          />
        </label>
        <label>
          {uiText("ui.7b4888049459")}
          <input
            maxLength={160}
            value={guest.lastName || ""}
            onChange={(event) =>
              onChange({ ...guest, lastName: event.target.value })
            }
          />
        </label>
      </div>
      <label>
        {uiText("ui.bb8e2701da83")}
        <input
          list="guest-category-options"
          maxLength={160}
          value={guest.category || "Other"}
          onChange={(event) =>
            onChange({ ...guest, category: event.target.value })
          }
        />
        <datalist id="guest-category-options">
          {guestCategories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </label>
      <div className="form-grid">
        <label>
          {uiText("ui.89e58ff3c751")}
          <input
            type="number"
            min={0}
            max={guest.guestCountAllowed || 20}
            value={guest.adultCount ?? 0}
            onChange={(event) =>
              onChange({ ...guest, adultCount: +event.target.value })
            }
          />
        </label>
        <label>
          {uiText("ui.87d3dc6029ee")}
          <input
            type="number"
            min={0}
            max={guest.guestCountAllowed || 20}
            value={guest.childCount ?? 0}
            onChange={(event) =>
              onChange({ ...guest, childCount: +event.target.value })
            }
          />
        </label>
      </div>
      <label>
        <input
          type="checkbox"
          checked={!!guest.reminderOptOut}
          onChange={(event) =>
            onChange({ ...guest, reminderOptOut: event.target.checked })
          }
        />
        {uiText("ui.74951b78a50a")}
      </label>
      <label>
        {uiText("ui.a1d75836fd27")}
        <input
          maxLength={160}
          value={guest.mealPreference || ""}
          onChange={(event) =>
            onChange({ ...guest, mealPreference: event.target.value })
          }
        />
      </label>
      <label>
        {uiText("ui.e9ed443a4b55")}
        <textarea
          maxLength={500}
          value={guest.dietaryRestrictions || ""}
          onChange={(event) =>
            onChange({ ...guest, dietaryRestrictions: event.target.value })
          }
        />
      </label>
      <label>
        {uiText("ui.72ff78fb2fd5")}
        <textarea
          maxLength={2000}
          value={guest.privateNotes || ""}
          onChange={(event) =>
            onChange({ ...guest, privateNotes: event.target.value })
          }
        />
      </label>
      <label>
        {uiText("ui.b830e9c807aa")}
        <input
          value={(guest.tags || []).join(",")}
          onChange={(event) =>
            onChange({ ...guest, tags: event.target.value.split(",") })
          }
        />
      </label>
    </details>
  );
}
