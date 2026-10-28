import { uiText } from "./i18n/uiText";
import "@fontsource/noto-sans-sinhala/400.css";
import "@fontsource/noto-sans-tamil/400.css";
import { installDiagnostics, recordDiagnostic } from "./utils/diagnostics";
import "./i18n";
import { StrictMode, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./styles/index.css";
import "./styles/invitation.css";
import "./styles/brand.css";
import "./styles/upgrade.css";
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string }
> {
  state = { error: "" };
  componentDidCatch(error: Error) {
    recordDiagnostic(error);
  }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <div className="full-state">
        <h1>{uiText("ui.5f9a0ee1c65d")}</h1>
        <p>{this.state.error}</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          {uiText("ui.7db5e46ea270")}
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
const stopDiagnostics = installDiagnostics();
import.meta.hot?.dispose(stopDiagnostics);
const client = new QueryClient();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
