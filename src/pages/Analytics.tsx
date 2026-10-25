import { uiText } from "../i18n/uiText";
import { formatNumber } from "../i18n/format";
import { useState } from "react";
import Dashboard from "./AnalyticsDashboard";
import { useWorkspace } from "../hooks/useWorkspace";
import { reportData, reportCSV } from "../utils/analyticsReport";
import { download } from "../utils";
export default function Analytics() {
  const { events, guests } = useWorkspace();
  const [eventId, setEventId] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [category, setCategory] = useState("");
  const report = reportData(events, guests, { eventId, from, to, category });
  return (
    <div className="analytics-report">
      <div className="upgrade-controls report-controls">
        <label>
          {uiText("ui.9625fd741776")}
          <select
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
          >
            <option value="">{uiText("ui.20b8487b3804")}</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          {uiText("ui.592e2d44f00a")}
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label>
          {uiText("ui.0e32686e4bd9")}
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <label>
          {uiText("ui.d77c086db33b")}
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">{uiText("ui.9d5097a83710")}</option>
            {[...new Set(guests.map((guest) => guest.category || "Other"))]
              .sort()
              .map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
          </select>
        </label>
        <button
          className="button outline"
          onClick={() =>
            download(
              "evently-analytics.csv",
              reportCSV(report.events, report.guests),
            )
          }
        >
          {uiText("ui.59502c05a50e")}
        </button>
        <button className="button outline" onClick={() => window.print()}>
          {uiText("ui.34e90c96d2c2")}
        </button>
      </div>
      <p className="report-scope">
        {report.events.length}
        {uiText("ui.9c7b2f5f3031")}
        {report.guests.length}
        {uiText("ui.d36c6e45d5a3")}
        {from || "any start"}
        {uiText("ui.87721689ee42")}
        {to || "any end"}
        {category
          ? uiText("ui.3267fe748b7b", { value0: String(category) })
          : ""}
        .
      </p>
      <div className="report-summary">
        <p>
          <strong>{formatNumber(report.expected)}</strong>
          {uiText("ui.694ed564aed1")}
        </p>
        <p>
          <strong>{formatNumber(report.checkedIn)}</strong>
          {uiText("ui.55659eddeadb")}
        </p>
        <p>
          <strong>{formatNumber(report.sharingInitiated)}</strong>
          {uiText("ui.9d12c86fc86c")}
        </p>
      </div>
      <p className="helper">{uiText("ui.72c527d9a1fb")}</p>
      <Dashboard analytics filtered={report} />
    </div>
  );
}
