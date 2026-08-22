export const indexableRoutes = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/tools", priority: "0.9", changefreq: "weekly" },
  { path: "/download", priority: "0.9", changefreq: "weekly" },
  { path: "/download/dola", priority: "0.9", changefreq: "weekly" },
  { path: "/download/dreamina", priority: "0.9", changefreq: "weekly" },
  { path: "/download/jimeng", priority: "0.9", changefreq: "weekly" },
  { path: "/image", priority: "0.8", changefreq: "weekly" },
  { path: "/image/watermark-remover", priority: "0.9", changefreq: "weekly" },
  { path: "/privacy", priority: "0.2", changefreq: "yearly" },
  { path: "/terms", priority: "0.2", changefreq: "yearly" },
  { path: "/disclaimer", priority: "0.2", changefreq: "yearly" }
] as const;
