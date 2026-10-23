import { defineConfig } from "@playwright/test";
const port = process.env.INVITEFLOW_TEST_PORT || "5173";
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: "tests",
  testMatch: "*.e2e.ts",
  workers: 1,
  timeout: 90000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: process.env.INVITEFLOW_EXTERNAL_SERVER
    ? undefined
    : {
        command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
        url: baseURL,
        reuseExistingServer: false,
        env: {
          VITE_FIREBASE_API_KEY: "demo-key",
          VITE_FIREBASE_AUTH_DOMAIN: "demo-inviteflow.firebaseapp.com",
          VITE_FIREBASE_PROJECT_ID: "demo-inviteflow",
          VITE_FIREBASE_STORAGE_BUCKET: "demo-inviteflow.appspot.com",
          VITE_FIREBASE_MESSAGING_SENDER_ID: "123",
          VITE_FIREBASE_APP_ID: "demo-app",
          VITE_USE_EMULATORS: "true",
          VITE_APP_URL: baseURL,
        },
      },
});
