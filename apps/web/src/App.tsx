import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { ImageWatermarkPage } from "./pages/ImageWatermarkPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { TaskPage } from "./pages/TaskPage";
import { ToolsPage } from "./pages/ToolsPage";
import { VideoSourcePage } from "./pages/VideoSourcePage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="tools/video" element={<VideoSourcePage />} />
        <Route path="tools/image" element={<ImageWatermarkPage />} />
        <Route path="tasks/:taskId" element={<TaskPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
