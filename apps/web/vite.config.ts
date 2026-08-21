import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { indexableRoutes } from "./site-routes";

export default defineConfig(({ mode }) => {
  const publicEnv = loadEnv(mode, process.cwd(), "VITE_");
  const market = process.env.VITE_MARKET ?? publicEnv.VITE_MARKET ?? "global";
  const chinese = market === "cn";
  const siteUrl = (process.env.VITE_PUBLIC_SITE_URL ?? publicEnv.VITE_PUBLIC_SITE_URL ?? (chinese ? "https://weiranlab.xyz" : "https://weiran.art")).replace(/\/$/, "");
  const description = chinese ? "未然Lab — 面向 AI 创作者的下载、图片、视频与创作辅助工具平台。" : "Weiran Lab — focused download, image, video, and publishing tools for AI creators.";
  return {
    plugins: [
      react(),
      {
        name: "market-html",
        transformIndexHtml(html) {
          return html
            .replace('<html lang="en">', `<html lang="${chinese ? "zh-CN" : "en"}">`)
            .replace("Weiran Lab — practical media tools for AI creators.", description)
            .replace("Weiran Lab — AI Creator Tools", chinese ? "未然Lab — AI 创作者工具平台" : "Weiran Lab — AI Creator Tools")
            .replace("<!-- market-meta -->", `<meta property="og:type" content="website" /><meta property="og:site_name" content="${chinese ? "未然Lab" : "Weiran Lab"}" /><meta property="og:description" content="${description}" /><meta property="og:url" content="${siteUrl}/" /><link rel="canonical" href="${siteUrl}/" />`);
        }
      },
      {
        name: "market-site-files",
        async closeBundle() {
          const outputDir = resolve(process.cwd(), "dist");
          await mkdir(outputDir, { recursive: true });
          const urls = indexableRoutes.map((route) => `  <url><loc>${siteUrl}${route.path}</loc><changefreq>${route.changefreq}</changefreq><priority>${route.priority}</priority></url>`).join("\n");
          await writeFile(resolve(outputDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, "utf8");
          await writeFile(resolve(outputDir, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`, "utf8");
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
