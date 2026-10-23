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
      toast.success("Changes saved.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function reauth() {
    if (!password)
      throw new Error("Enter your current password to change credentials.");
    await reauthenticateWithCredential(
      auth.currentUser!,
      EmailAuthProvider.credential(user!.email!, password),
    );
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A SPACE THAT FEELS LIKE YOU</span>
          <h1>Make yourself at home.</h1>
          <p>Your profile, your workspace, your peace of mind.</p>
        </div>
      </div>
      <div className="settings-layout">
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>
                <UserRound size={19} />
                Your profile
              </h2>
              <p>The person behind the occasions.</p>
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
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={160}
              />
            </label>
            <label>
              Email address
              <input value={user?.email || ""} disabled />
            </label>
            <Button disabled={busy}>Save profile</Button>
          </form>
        </section>
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>
                <Building2 size={19} />
                Your workspace
              </h2>
              <p>A private home for all your gatherings.</p>
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
              Workspace name
              <input
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                required
                minLength={2}
                maxLength={160}
              />
            </label>
            <p className="helper">
              Only your account has access to this workspace and its private
              guest data.
            </p>
            <button disabled={busy} className="button primary">
              Save workspace
            </button>
          </form>
        </section>
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>
                <LockKeyhole size={19} />
                Account security
              </h2>
              <p>Keep your little corner of the world secure.</p>
            </div>
          </div>
          <div className="form-content">
            <label>
              Current password
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
                  toast.info(
                    "Verify the new email using the link we sent. Your current email stays active until verification.",
                  );
                });
              }}
            >
              <label>
                New email address
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
                Send verification email
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
                New password
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
                Update password
              </button>
            </form>
          </div>
        </section>
        <section className="panel settings-panel signout-panel">
          <LogOut size={25} />
          <h2>See you at the next occasion.</h2>
          <p>Sign out of this device when you’re done.</p>
          <button
            className="button outline"
            disabled={busy}
            onClick={() => action(logout)}
          >
            Sign out
          </button>
        </section>
      </div>
    </>
  );
}
