import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("konva")) return "canvas";
            if (id.includes("recharts") || id.includes("d3-")) return "charts";
            if (id.includes("@firebase") || id.includes("/firebase/"))
              return "firebase";
          }
        },
      },
    },
  },
  test: {
    exclude: ["node_modules/**", "tests/*.integration.ts", "tests/*.e2e.ts"],
  },
});
