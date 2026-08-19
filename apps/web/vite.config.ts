import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const publicEnv = loadEnv(mode, process.cwd(), "VITE_");
  const market = process.env.VITE_MARKET ?? publicEnv.VITE_MARKET ?? "global";
  const chinese = market === "cn";
  return {
    plugins: [
      react(),
      {
        name: "market-html",
        transformIndexHtml(html) {
          return html
            .replace('<html lang="en">', `<html lang="${chinese ? "zh-CN" : "en"}">`)
            .replace("Weiran Lab — practical media tools for AI creators.", chinese ? "未然Lab — 面向 AI 创作者的素材处理工具平台。" : "Weiran Lab — practical media tools for AI creators.")
            .replace("Weiran Lab — AI Creator Tools", chinese ? "未然Lab — AI 创作者工具平台" : "Weiran Lab — AI Creator Tools");
        }
      }
    ],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "")
        }
      }
    }
  };
});
