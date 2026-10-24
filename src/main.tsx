import { StrictMode, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./styles/index.css";
import "./styles/invitation.css";
import "./styles/brand.css";
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <div className="full-state">
        <h1>We hit a little snag.</h1>
        <p>{this.state.error}</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Reload Evently Invitations
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
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
