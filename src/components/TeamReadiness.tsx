import { uiText } from "../i18n/uiText";
import { useAuth } from "../contexts/AuthContext";
import { rolePermissions } from "../config/platform";
export function TeamReadiness() {
  const { user } = useAuth();
  return (
    <section className="panel settings-panel">
      <div className="form-content">
        <h2>{uiText("ui.aa01640cff61")}</h2>
        <p>
          <strong>{user?.displayName || user?.email}</strong>
          {uiText("ui.86f9f415e706")}
        </p>
        <p className="helper">{uiText("ui.35db544838a2")}</p>
        <details>
          <summary>{uiText("ui.a7c2da50e477")}</summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{uiText("ui.14736a2eb9f4")}</th>
                  <th>{uiText("ui.abccc78cc93c")}</th>
                  <th>{uiText("ui.12f67f8539c4")}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(rolePermissions).map(([role, permissions]) => (
                  <tr key={role}>
                    <td>{role}</td>
                    <td>{permissions.join(", ")}</td>
                    <td>
                      {role === "owner"
                        ? uiText("ui.92340695899b")
                        : uiText("ui.2b0e80483609")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </section>
  );
}
