const api = require("../../services/api");
const catalog = require("../../utils/tool-catalog");
const statusText = { PENDING: "排队中", PROCESSING: "处理中", SUCCESS: "已完成", FAILED: "失败" };

function formatTime(value) {
  const date = new Date(value);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

Page({
  data: { view: "history", pageTitle: "历史任务", pageDescription: "全部素材处理进度", loading: true, tasks: [] },
  onLoad(query) {
    const view = query.view === "files" ? "files" : "history";
    this.setData({ view, pageTitle: view === "files" ? "文件记录" : "历史任务", pageDescription: view === "files" ? "已完成的处理结果" : "全部素材处理进度" });
  },
  onShow() { this.loadTasks(); },
  async loadTasks() {
    this.setData({ loading: true });
    try {
      const response = await api.listTasks(50);
      let taskList = response.tasks || [];
      if (this.data.view === "files") taskList = taskList.filter((task) => task.status === "SUCCESS");
      this.setData({ tasks: taskList.map((task) => {
        const tool = catalog.getToolByTaskType(task.taskType) || { name: "素材任务", icon: "工", tone: "blue" };
        return { ...task, kind: task.taskType === "VIDEO_WATERMARK_REMOVE" ? "video" : "image", name: tool.name, icon: tool.icon, tone: tool.tone, statusText: statusText[task.status] || task.status, statusClass: task.status.toLowerCase(), createdAtText: formatTime(task.createdAt) };
      }) });
    } catch (error) { wx.showToast({ title: error.message || "获取记录失败", icon: "none" }); } finally { this.setData({ loading: false }); }
  },
  openTask(event) { wx.navigateTo({ url: `/pages/task-detail/index?id=${event.currentTarget.dataset.id}&kind=${event.currentTarget.dataset.kind}` }); }
});
