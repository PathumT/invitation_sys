import { uiText } from "../i18n/uiText";
import { Link } from "react-router-dom";
import { planDefinitions } from "../config/platform";
export default function Plans() {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{uiText("ui.3235962c9b95")}</span>
          <h1>{uiText("ui.46ebe399c2ca")}</h1>
          <p>{uiText("ui.2049b053d59d")}</p>
        </div>
      </div>
      <div className="plan-grid">
        {planDefinitions.map((plan) => (
          <section className="panel plan-card" key={plan.id}>
            <h2>{plan.name}</h2>
            <p className="helper">{uiText("ui.6fc4ba3fe19c")}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button className="button outline full" disabled>
              {uiText("ui.d787cf27f25f")}
            </button>
          </section>
        ))}
      </div>
      <p className="helper">{uiText("ui.86948ae83fa4")}</p>
      <Link className="button outline" to="/settings">
        {uiText("ui.dc9c6093b76f")}
      </Link>
    </>
  );
}
