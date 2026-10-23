import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, writeBatch, serverTimestamp, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
export class WorkspaceAccessError extends Error {
  constructor() {
    super(
      "You signed in successfully, but Firestore blocked access to your workspace. Publish this app’s Firestore security rules to the Firebase project configured in .env. If App Check enforcement is enabled, configure App Check as well.",
    );
    this.name = "WorkspaceAccessError";
  }
}
async function provisionWorkspace() {
  try {
    await ensureWorkspace();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "permission-denied"
    ) {
      throw new WorkspaceAccessError();
    }
    throw error;
  }
}
export async function ensureWorkspace() {
  const u = auth.currentUser;
  if (!u || u.isAnonymous) return;
  const ref = doc(db, "tenants", u.uid);
  if ((await getDoc(ref)).exists()) return;
  const b = writeBatch(db);
  b.set(ref, {
    name: `${u.displayName || "My"} workspace`,
    ownerId: u.uid,
    createdAt: serverTimestamp(),
  });
  b.set(doc(db, "users", u.uid), {
    name: u.displayName || "",
    email: u.email,
    tenantId: u.uid,
    createdAt: serverTimestamp(),
  });
  await b.commit();
}
export async function register(name: string, email: string, password: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: name });
  await provisionWorkspace();
}
export async function login(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
  await provisionWorkspace();
}
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
  await provisionWorkspace();
}
export const logout = () => signOut(auth);
export const resetPassword = (email: string) =>
  sendPasswordResetEmail(auth, email);
