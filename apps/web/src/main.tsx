import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import { marketConfig } from "./config/market";
import { copy } from "./i18n/copy";

document.documentElement.lang = marketConfig.locale;
document.title = marketConfig.locale === "zh-CN" ? "未然Lab — AI 创作者工具平台" : "Weiran Lab — AI Creator Tools";
document.querySelector('meta[name="description"]')?.setAttribute("content", copy.layout.tagline);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
