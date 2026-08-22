import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CategoryPage } from "./pages/CategoryPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { ImageWatermarkPage } from "./pages/ImageWatermarkPage";
import { LegalPage } from "./pages/LegalPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { TaskPage } from "./pages/TaskPage";
import { ToolLandingPage } from "./pages/ToolLandingPage";
import { ToolsPage } from "./pages/ToolsPage";
import { VideoSourcePage } from "./pages/VideoSourcePage";

function LegacyToolRedirect({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="download" element={<CategoryPage categoryId="download" />} />
        <Route path="download/dola" element={<VideoSourcePage platformId="dola" />} />
        <Route path="download/dreamina" element={<VideoSourcePage platformId="dreamina" />} />
        <Route path="download/jimeng" element={<VideoSourcePage platformId="jimeng" />} />
        <Route path="download/:toolSlug" element={<ToolLandingPage />} />
        <Route path="image" element={<CategoryPage categoryId="image" />} />
        <Route path="image/watermark-remover" element={<ImageWatermarkPage />} />
        <Route path="image/:toolSlug" element={<ToolLandingPage />} />
        <Route path="video" element={<CategoryPage categoryId="video" />} />
        <Route path="video/:toolSlug" element={<ToolLandingPage />} />
        <Route path="creator" element={<CategoryPage categoryId="creator" />} />
        <Route path="creator/:toolSlug" element={<ToolLandingPage />} />
        <Route path="tools/video" element={<LegacyToolRedirect to="/download/dola" />} />
        <Route path="tools/image" element={<LegacyToolRedirect to="/image/watermark-remover" />} />
        <Route path="tasks/:taskId" element={<TaskPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="privacy" element={<LegalPage kind="privacy" />} />
        <Route path="terms" element={<LegalPage kind="terms" />} />
        <Route path="disclaimer" element={<LegalPage kind="disclaimer" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
