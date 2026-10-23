import { beforeEach, describe, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  googleSignIn: vi.fn(),
  googleParameters: vi.fn(),
  getDoc: vi.fn(),
  commit: vi.fn(),
  set: vi.fn(),
}));
vi.mock("../src/firebase/config", () => ({
  auth: {
    currentUser: {
      uid: "console-created-user",
      isAnonymous: false,
      email: "owner@example.test",
      displayName: null,
    },
  },
  db: {},
}));
vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: mocks.signIn,
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithPopup: mocks.googleSignIn,
  GoogleAuthProvider: class {
    setCustomParameters = mocks.googleParameters;
  },
}));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...path: string[]) => path.join("/"),
  getDoc: mocks.getDoc,
  serverTimestamp: () => "server-time",
  writeBatch: () => ({ set: mocks.set, commit: mocks.commit }),
}));
import { login, loginWithGoogle, WorkspaceAccessError } from "../src/services/authService";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.signIn.mockResolvedValue({});
  mocks.getDoc.mockResolvedValue({ exists: () => false });
  mocks.commit.mockResolvedValue(undefined);
});
describe("workspace access after login", () => {
  it("provisions a console-created account without a display name", async () => {
    await login("owner@example.test", "password");
    expect(mocks.set).toHaveBeenCalledWith(
      "tenants/console-created-user",
      expect.objectContaining({
        ownerId: "console-created-user",
        name: "My workspace",
      }),
    );
    expect(mocks.set).toHaveBeenCalledWith(
      "users/console-created-user",
      expect.objectContaining({ tenantId: "console-created-user" }),
    );
    expect(mocks.commit).toHaveBeenCalledOnce();
  });
  it("explains denied workspace reads separately from an invalid password", async () => {
    mocks.getDoc.mockRejectedValue({ code: "permission-denied" });
    await expect(
      login("owner@example.test", "password"),
    ).rejects.toBeInstanceOf(WorkspaceAccessError);
  });
  it("also explains denied workspace creation", async () => {
    mocks.commit.mockRejectedValue({ code: "permission-denied" });
    await expect(login("owner@example.test", "password")).rejects.toThrow(
      "You signed in successfully",
    );
  });
  it("keeps credential errors and does not access Firestore when authentication fails", async () => {
    const error = new Error("Invalid credential");
    mocks.signIn.mockRejectedValue(error);
    await expect(login("owner@example.test", "wrong")).rejects.toBe(error);
    expect(mocks.getDoc).not.toHaveBeenCalled();
  });
});

describe("Google workspace access", () => {
  it("creates a workspace after Google authentication", async () => {
    await loginWithGoogle();
    expect(mocks.googleParameters).toHaveBeenCalledWith({ prompt: "select_account" });
    expect(mocks.googleSignIn).toHaveBeenCalledOnce();
    expect(mocks.commit).toHaveBeenCalledOnce();
  });
  it("preserves an existing workspace on Google sign-in", async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => true });
    await loginWithGoogle();
    expect(mocks.commit).not.toHaveBeenCalled();
  });
  it("does not provision a workspace when the popup fails or is cancelled", async () => {
    const error = { code: "auth/popup-closed-by-user" };
    mocks.googleSignIn.mockRejectedValue(error);
    await expect(loginWithGoogle()).rejects.toBe(error);
    expect(mocks.getDoc).not.toHaveBeenCalled();
  });
  it("explains denied workspace access after Google authentication", async () => {
    mocks.getDoc.mockRejectedValue({ code: "permission-denied" });
    await expect(loginWithGoogle()).rejects.toBeInstanceOf(WorkspaceAccessError);
  });
});
