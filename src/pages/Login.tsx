import { uiText } from "../i18n/uiText";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authSchema } from "../utils/authValidation";
import {
  ArrowRight,
  Paintbrush,
  SlidersHorizontal,
  Send,
  Heart,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  Users,
  Share2,
  ChartNoAxesColumnIncreasing,
} from "lucide-react";
import { Brand } from "../components/Brand";
import "../styles/auth.css";
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
function AuthBenefits({ registration = false }: { registration?: boolean }) {
  const benefits = registration
    ? [
        {
          Icon: Paintbrush,
          title: "Custom invitations",
          text: "Beautiful designs for every occasion.",
          color: "sage",
        },
        {
          Icon: Users,
          title: "Guest management",
          text: "Keep your people and plans organized.",
          color: "sage",
        },
        {
          Icon: Share2,
          title: "Instant sharing",
          text: "Share your invitation in seconds.",
          color: "sage",
        },
        {
          Icon: ChartNoAxesColumnIncreasing,
          title: "RSVP tracking",
          text: "See responses in real time.",
          color: "sage",
        },
      ]
    : [
        {
          Icon: Paintbrush,
          title: "Beautiful Templates",
          text: "For every occasion",
          color: "sage",
        },
        {
          Icon: SlidersHorizontal,
          title: "Easily Customize",
          text: "Make it truly yours",
          color: "rose",
        },
        {
          Icon: Send,
          title: "Share Instantly",
          text: "Via WhatsApp or a personal link",
          color: "lavender",
        },
        {
          Icon: Heart,
          title: "Create Lasting Memories",
          text: "Because moments matter",
          color: "gold",
        },
      ];
  return (
    <ul className="auth-benefits">
      {benefits.map(({ Icon, title, text, color }) => (
        <li key={title}>
          <span className={`auth-benefit-icon ${color}`}>
            <Icon size={23} strokeWidth={1.5} />
          </span>
          <span>
            <strong>{title}</strong>
            <small>{text}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}
export default function Login({
  registration = false,
}: {
  registration?: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const schema = authSchema(registration);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
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
        await register(v.name.trim(), v.email, v.password);
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
          "auth/popup-blocked":
            "Allow pop-ups for this website, then try Google sign-in again.",
          "auth/unauthorized-domain":
            "Add this website’s domain to Firebase Authentication’s authorized domains, then try again.",
          "auth/operation-not-allowed":
            "Enable Google in Firebase Authentication’s sign-in providers.",
          "auth/account-exists-with-different-credential":
            "This email already uses another sign-in method. Sign in with that method first.",
          "auth/network-request-failed":
            "Could not connect to Google sign-in. Check your connection and try again.",
        };
        if (
          code !== "auth/popup-closed-by-user" &&
          code !== "auth/cancelled-popup-request"
        )
          toast.error(messages[code || ""] || errorMessage(e));
      }
    } finally {
      setGoogleBusy(false);
    }
  }
  return (
    <div
      className={`auth-page evently-auth ${registration ? "evently-signup" : ""}`}
    >
      <div className="auth-story">
        <Link
          className="auth-brand-link"
          to="/"
          aria-label={uiText("ui.a1d0ca62351d")}
        >
          <Brand />
        </Link>
        <div className="auth-story-copy">
          <span className="eyebrow">
            {registration
              ? uiText("ui.58640113daf6")
              : uiText("ui.d0334b3396ac")}
          </span>
          <h1>
            {registration ? (
              <>
                {uiText("ui.d562adb5dd0d")}
                <br />
                {uiText("ui.16283ba35b55")}
              </>
            ) : (
              <>
                {uiText("ui.58f4115f4080")}
                <br />
                {uiText("ui.f4159af5f52f")}
              </>
            )}
          </h1>
          <p>
            {registration ? (
              <>
                {uiText("ui.429e661d11b1")}
                <br />
                {uiText("ui.0acae8abfbf0")}
              </>
            ) : (
              <>
                {uiText("ui.2ac62cb91ed8")}
                <br className="auth-desktop-break" />
                {uiText("ui.e05d4bb47123")}
              </>
            )}
          </p>
          {!registration && <AuthBenefits />}
        </div>
        <p className="auth-story-footer">
          <span />
          {uiText("ui.5c0de7b01b95")}
        </p>
        {registration && <AuthBenefits registration />}
      </div>
      <div className="auth-form">
        <div className="auth-journey" aria-hidden="true">
          <span>{uiText("ui.fde9c5013bf5")}</span>
          <span>{uiText("ui.0398e046d786")}</span>
          <span>{uiText("ui.0b060acf4d67")}</span>
          <span>{uiText("ui.97165fc5b7d1")}</span>
        </div>
        <div className="auth-login-card">
          <svg
            className="auth-card-leaves"
            viewBox="0 0 150 200"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M145 0C130 75 60 90 26 195"
              stroke="#b6c3a7"
              strokeWidth="1.5"
            />
            <g fill="#c4cfb7" fillOpacity=".5">
              <path d="M133 32C86 40 96 3 104 0c25 9 24 20 29 32Z" />
              <path d="M117 60c-37 8-56-14-56-20 25-5 45 8 56 20Z" />
              <path d="M101 82c35-3 47-34 43-43-26 4-39 22-43 43Z" />
              <path d="M80 108c-40 0-51-24-50-32 25 1 42 15 50 32Z" />
              <path d="M63 135c34-4 42-27 40-39-23 4-36 21-40 39Z" />
              <path d="M43 162C10 147 5 125 13 114c21 13 30 29 30 48Z" />
              <path d="M32 184c31-4 40-25 39-35-24 4-33 18-39 35Z" />
            </g>
          </svg>
          {registration && (
            <span className="eyebrow">{uiText("ui.2487e6c635b9")}</span>
          )}
          <h1>
            {registration ? (
              <>
                {uiText("ui.d2fce326c100")}
                <br />
                {uiText("ui.9432c8e41f32")}
              </>
            ) : (
              <>
                {uiText("ui.0f4cadbc551a")}
                <br />
                {uiText("ui.2b9cb4b0babd")}
              </>
            )}
          </h1>
          <p className="muted">
            {registration
              ? uiText("ui.6e110a7f0edd")
              : uiText("ui.bc194b65aa19")}
          </p>
          {workspaceError && (
            <div className="error-banner" role="alert">
              <p>{workspaceError}</p>
              <p>
                {uiText("ui.bd0c4ee8f22b")}
                <strong>{auth.app.options.projectId}</strong>
              </p>
              <a
                className="text-link"
                href={`https://console.firebase.google.com/project/${encodeURIComponent(auth.app.options.projectId || "")}/firestore/rules`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {uiText("ui.42947a6c3560")}
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
            {googleBusy ? uiText("ui.7f806263c4e3") : t("auth.google")}
          </button>
          <div className="auth-divider">
            <span>
              {registration
                ? uiText("ui.14233b39a312")
                : uiText("ui.829e5b28af38")}
            </span>
          </div>
          <form onSubmit={submit} noValidate>
            {registration && (
              <label>
                {t("auth.fullName")}
                <input
                  autoComplete="name"
                  {...field("name")}
                  required
                  maxLength={160}
                  placeholder={uiText("ui.6cea57c2fb6c")}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "auth-name-error" : undefined}
                />
                {errors.name && (
                  <small className="error" id="auth-name-error" role="alert">
                    {errors.name.message}
                  </small>
                )}
              </label>
            )}
            <label>
              {t("common.email")}
              <span className="auth-input-wrap">
                <Mail size={18} aria-hidden="true" />
                <input
                  type="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? "auth-email-error" : undefined
                  }
                  autoComplete="email"
                  {...field("email")}
                  required
                  placeholder={uiText("ui.53e6cdc30765")}
                />
              </span>
              {errors.email && (
                <small className="error" id="auth-email-error" role="alert">
                  {errors.email.message}
                </small>
              )}
            </label>
            <div className="auth-field">
              <label htmlFor="auth-password">{t("common.password")}</label>
              <span className="auth-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  id="auth-password"
                  type={passwordVisible ? "text" : "password"}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "auth-password-error" : undefined
                  }
                  autoComplete={
                    registration ? "new-password" : "current-password"
                  }
                  {...field("password")}
                  required
                  placeholder={
                    registration
                      ? uiText("ui.4defceba0862")
                      : uiText("ui.c06bf9670174")
                  }
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={
                    passwordVisible
                      ? uiText("ui.a60a56c584b3")
                      : uiText("ui.6aeaa6a53d09")
                  }
                  aria-controls="auth-password"
                  aria-pressed={passwordVisible}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                >
                  {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
              {errors.password && (
                <small className="error" id="auth-password-error" role="alert">
                  {errors.password.message}
                </small>
              )}
            </div>
            {registration && (
              <div className="auth-field">
                <label htmlFor="auth-confirm">
                  {t("auth.confirmPassword")}
                </label>
                <span className="auth-input-wrap">
                  <input
                    id="auth-confirm"
                    type={confirmVisible ? "text" : "password"}
                    autoComplete="new-password"
                    {...field("confirm")}
                    required
                    placeholder={uiText("ui.bfd8c343fbd2")}
                    aria-invalid={!!errors.confirm}
                    aria-describedby={
                      errors.confirm ? "auth-confirm-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    aria-label={
                      confirmVisible
                        ? uiText("ui.2bddadd8d881")
                        : uiText("ui.bd17fffd90f9")
                    }
                    aria-controls="auth-confirm"
                    aria-pressed={confirmVisible}
                    onClick={() => setConfirmVisible((visible) => !visible)}
                  >
                    {confirmVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
                {errors.confirm && (
                  <small className="error" id="auth-confirm-error" role="alert">
                    {errors.confirm.message}
                  </small>
                )}
              </div>
            )}
            {!registration && (
              <button
                type="button"
                className="text-button"
                disabled={reset || googleBusy || isSubmitting}
                onClick={async () => {
                  const email = getValues("email");
                  if (!email) {
                    toast.error(uiText("ui.e30416d70536"));
                    return;
                  }
                  setReset(true);
                  try {
                    await resetPassword(email);
                    toast.success(uiText("ui.a5615910e9d3"));
                  } catch (e) {
                    toast.error(errorMessage(e));
                  } finally {
                    setReset(false);
                  }
                }}
              >
                {reset ? uiText("ui.b8ed5279e897") : t("auth.forgotPassword")}
              </button>
            )}
            <button
              className="button primary"
              disabled={isSubmitting || googleBusy || reset}
            >
              {isSubmitting
                ? uiText("ui.4660a983366f")
                : registration
                  ? t("auth.createAccount")
                  : t("auth.signInWorkspace")}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {registration
              ? uiText("ui.404d240a4e67")
              : uiText("ui.1b545b23fae3")}{" "}
            <Link to={registration ? "/login" : "/register"}>
              {registration ? t("auth.signIn") : uiText("ui.b6ab95ea0749")}
            </Link>
          </p>
          <div className="secure-note">{uiText("ui.1d3d256b6d35")}</div>
        </div>
      </div>
    </div>
  );
}
