import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flower2, ArrowRight } from "lucide-react";
import {
  login,
  loginWithGoogle,
  register,
  resetPassword,
  WorkspaceAccessError,
} from "../services/authService";
import { auth } from "../firebase/config";
import { toast } from "sonner";
import { errorMessage } from "../utils";
const schema = z.object({
  name: z.string(),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
  confirm: z.string(),
});
export default function Login({
  registration = false,
}: {
  registration?: boolean;
}) {
  const navigate = useNavigate();
  const [reset, setReset] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);
  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });
  const submit = handleSubmit(async (v) => {
    if (googleBusy) return;
    setWorkspaceError("");
    try {
      if (registration) {
        if (v.name.trim().length < 2) throw new Error("Enter your full name.");
        if (v.password !== v.confirm)
          throw new Error("Passwords do not match.");
        await register(v.name, v.email, v.password);
      } else await login(v.email, v.password);
      navigate("/");
    } catch (e) {
      if (e instanceof WorkspaceAccessError) setWorkspaceError(e.message);
      else toast.error(errorMessage(e));
    }
  });
  async function googleSignIn() {
    setGoogleBusy(true);
    setWorkspaceError("");
    try {
      await loginWithGoogle();
      navigate("/");
    } catch (e) {
      if (e instanceof WorkspaceAccessError) setWorkspaceError(e.message);
      else {
        const code = (e as { code?: string })?.code;
        const messages: Record<string, string> = {
          "auth/popup-blocked": "Allow pop-ups for this website, then try Google sign-in again.",
          "auth/unauthorized-domain": "Add this website’s domain to Firebase Authentication’s authorized domains, then try again.",
          "auth/operation-not-allowed": "Enable Google in Firebase Authentication’s sign-in providers.",
          "auth/account-exists-with-different-credential": "This email already uses another sign-in method. Sign in with that method first.",
          "auth/network-request-failed": "Could not connect to Google sign-in. Check your connection and try again.",
        };
        if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request")
          toast.error(messages[code || ""] || errorMessage(e));
      }
    } finally {
      setGoogleBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-story">
        <Link className="brand" to="/">
          <Flower2 />
          InviteFlow.
        </Link>
        <div>
          <span className="eyebrow">A LITTLE INVITATION. A BIG MOMENT.</span>
          <h1>
            Bring your
            <br />
            people together.
          </h1>
          <p>
            Beautiful invitations. Thoughtful details.
            <br />
            Every response, in one happy place.
          </p>
          <div className="auth-art">
            <span>you’re invited</span>
            <Flower2 size={88} strokeWidth={0.6} />
            <h2>
              Something
              <br />
              wonderful awaits.
            </h2>
            <small>LET’S MAKE IT AN OCCASION</small>
          </div>
        </div>
        <small>Made for moments that matter.</small>
      </div>
      <div className="auth-form">
        <div>
          <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>
            {registration ? "Make room for celebration." : "Welcome back."}
          </h1>
          <p className="muted">
            {registration
              ? "Create your private invitation workspace."
              : "Your people. Your plans. All in one place."}
          </p>
          {workspaceError && (
            <div className="error-banner" role="alert">
              <p>{workspaceError}</p>
              <p>
                Firebase project: <strong>{auth.app.options.projectId}</strong>
              </p>
              <a
                className="text-link"
                href={`https://console.firebase.google.com/project/${encodeURIComponent(auth.app.options.projectId || "")}/firestore/rules`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Firestore rules ↗
              </a>
            </div>
          )}
          <button
            type="button"
            className="button outline google-sign-in"
            disabled={googleBusy || isSubmitting || reset}
            onClick={googleSignIn}
          >
            <img src="/google-mark.svg" alt="" width={20} height={20} />
            {googleBusy ? "Connecting to Google…" : "Continue with Google"}
          </button>
          <div className="auth-divider"><span>or continue with email</span></div>
          <form onSubmit={submit}>
            {registration && (
              <label>
                Full name
                <input autoComplete="name" {...field("name")} required />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                {...field("email")}
                required
              />
              {errors.email && (
                <small className="error">{errors.email.message}</small>
              )}
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete={
                  registration ? "new-password" : "current-password"
                }
                {...field("password")}
                required
              />
              {errors.password && (
                <small className="error">{errors.password.message}</small>
              )}
            </label>
            {registration && (
              <label>
                Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  {...field("confirm")}
                  required
                />
              </label>
            )}
            {!registration && (
              <button
                type="button"
                className="text-button"
                disabled={reset || googleBusy || isSubmitting}
                onClick={async () => {
                  const email = getValues("email");
                  if (!email) {
                    toast.error("Enter your email address first.");
                    return;
                  }
                  setReset(true);
                  try {
                    await resetPassword(email);
                    toast.success("Password reset email sent.");
                  } catch (e) {
                    toast.error(errorMessage(e));
                  } finally {
                    setReset(false);
                  }
                }}
              >
                {reset ? "Sending…" : "Forgot password?"}
              </button>
            )}
            <button className="button primary" disabled={isSubmitting || googleBusy || reset}>
              {isSubmitting
                ? "Please wait…"
                : registration
                  ? "Create account"
                  : "Sign in to your workspace"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {registration ? "Already part of InviteFlow?" : "New around here?"}{" "}
            <Link to={registration ? "/login" : "/register"}>
              {registration ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <div className="secure-note">
            Your events and guest details stay in your private workspace.
          </div>
        </div>
      </div>
    </div>
  );
}
