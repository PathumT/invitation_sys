import { uiText } from "../i18n/uiText";
import { browserDiagnostics } from "../utils/diagnostics";
import { download } from "../utils";
import { TenantBrandingSettings } from "../components/TenantBrandingSettings";
import { TeamReadiness } from "../components/TeamReadiness";
import { Link } from "react-router-dom";
import { localeCatalog, localeIsReady } from "../i18n";
import { Button } from "../components/ui/button";
import { useState, useEffect } from "react";
import {
  updateProfile,
  verifyBeforeUpdateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { auth, db } from "../firebase/config";
import { ensureWorkspace, logout } from "../services/authService";
import { toast } from "sonner";
import { errorMessage } from "../utils";
import { UserRound, Building2, LockKeyhole, LogOut } from "lucide-react";
export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [workspace, setWorkspace] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getDoc(doc(db, "tenants", user!.uid))
      .then((s) => setWorkspace(s.data()?.name || ""))
      .catch((e) => toast.error(errorMessage(e)));
  }, [user]);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      toast.success(uiText("ui.12b3f1a3e924"));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function reauth() {
    if (!password) throw new Error(uiText("ui.ce1109d39859"));
    await reauthenticateWithCredential(
      auth.currentUser!,
      EmailAuthProvider.credential(user!.email!, password),
    );
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{uiText("ui.a406bb5c7ca5")}</span>
          <h1>{uiText("ui.0fee4c6e23f4")}</h1>
          <p>{uiText("ui.7afeb647d45a")}</p>
        </div>
      </div>
      <div className="settings-layout">
        <section className="panel settings-panel">
          <div className="form-content">
            <h2>{uiText("ui.6a8576dff840")}</h2>
            <p className="helper">{uiText("ui.2c235c245066")}</p>
            <button
              className="button outline"
              onClick={() =>
                download(
                  "evently-browser-diagnostics.json",
                  JSON.stringify(browserDiagnostics(), null, 2),
                  "application/json",
                )
              }
            >
              {uiText("ui.68d79a936a17")}
            </button>
          </div>
        </section>
        <TeamReadiness />
        <TenantBrandingSettings />
        <section className="panel settings-panel">
          <div className="form-content">
            <h2>{uiText("ui.04c376f7f552")}</h2>
            <p>{uiText("ui.84be3f5d94d7")}</p>
            <Link className="button outline" to="/plans">
              {uiText("ui.57841286903e")}
            </Link>
          </div>
        </section>
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>
                <UserRound size={19} />
                {uiText("ui.528d89ad72cb")}
              </h2>
              <p>{uiText("ui.c41c2a4f5624")}</p>
            </div>
          </div>
          <form
            className="form-content"
            onSubmit={(e) => {
              e.preventDefault();
              void action(async () => {
                await ensureWorkspace();
                await updateProfile(auth.currentUser!, {
                  displayName: name.trim(),
                });
                await updateDoc(doc(db, "users", user!.uid), {
                  name: name.trim(),
                });
              });
            }}
          >
            <label>
              {uiText("auth.fullName")}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={160}
              />
            </label>
            <label>
              {uiText("common.email")}
              <input value={user?.email || ""} disabled />
            </label>
            <Button disabled={busy}>{uiText("ui.0c8209e72ec8")}</Button>
          </form>
        </section>
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>
                <Building2 size={19} />
                {uiText("ui.4d0260e6c3e7")}
              </h2>
              <p>{uiText("ui.4f2ea19b878a")}</p>
            </div>
          </div>
          <form
            className="form-content"
            onSubmit={(e) => {
              e.preventDefault();
              void action(async () => {
                await ensureWorkspace();
                await updateDoc(doc(db, "tenants", user!.uid), {
                  name: workspace.trim(),
                });
              });
            }}
          >
            <label>
              {uiText("ui.9619649d8dc1")}
              <input
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                required
                minLength={2}
                maxLength={160}
              />
            </label>
            <p className="helper">{uiText("ui.e583e76263b7")}</p>
            <button disabled={busy} className="button primary">
              {uiText("ui.6a9c1db1f5de")}
            </button>
          </form>
        </section>
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>
                <LockKeyhole size={19} />
                {uiText("ui.1d85c11e1444")}
              </h2>
              <p>{uiText("ui.0dbeb9970a1c")}</p>
            </div>
          </div>
          <div className="form-content">
            <label>
              {uiText("ui.72ed2bd767ce")}
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void action(async () => {
                  await reauth();
                  await verifyBeforeUpdateEmail(auth.currentUser!, email);
                  toast.info(uiText("ui.594ff6116297"));
                });
              }}
            >
              <label>
                {uiText("ui.bb0d06f56708")}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <button
                disabled={busy || email === user?.email}
                className="button outline"
              >
                {uiText("ui.3e01e3010ce7")}
              </button>
            </form>
            <hr />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void action(async () => {
                  await reauth();
                  await updatePassword(auth.currentUser!, newPassword);
                  setNewPassword("");
                  setPassword("");
                });
              }}
            >
              <label>
                {uiText("ui.3dd9df4441fb")}
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>
              <button disabled={busy} className="button outline">
                {uiText("ui.fe45b4014135")}
              </button>
            </form>
          </div>
        </section>
        <section className="panel settings-panel">
          <div className="form-content">
            <h2>{uiText("ui.a4fe65264ef7")}</h2>
            <label>
              {uiText("ui.8027f432a7fb")}
              <select defaultValue="en" aria-describedby="language-review-note">
                {localeCatalog.map((locale) => (
                  <option
                    key={locale.code}
                    value={locale.code}
                    disabled={!localeIsReady(locale.code)}
                  >
                    {locale.name}
                    {localeIsReady(locale.code)
                      ? ""
                      : uiText("ui.a358615c19bd")}
                  </option>
                ))}
              </select>
            </label>
            <p id="language-review-note" className="helper">
              {uiText("ui.4b19a42c48a5")}
            </p>
          </div>
        </section>
        <section className="panel settings-panel signout-panel">
          <LogOut size={25} />
          <h2>{uiText("ui.78b426f141a9")}</h2>
          <p>{uiText("ui.4517f0d27ee0")}</p>
          <button
            className="button outline"
            disabled={busy}
            onClick={() => action(logout)}
          >
            {uiText("nav.signOut")}
          </button>
        </section>
      </div>
    </>
  );
}
