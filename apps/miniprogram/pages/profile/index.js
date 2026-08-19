const api = require("../../services/api");

Page({
  data: { taskCount: 0, resultCount: 0 },
  onShow() { this.loadSummary(); },
  async loadSummary() {
    try {
      const { tasks } = await api.listTasks(50);
      this.setData({ taskCount: tasks.length, resultCount: tasks.filter((task) => task.status === "SUCCESS").length });
    } catch (_) { /* A first-time or offline user sees the zero state. */ }
  },
  openTasks(event) { wx.navigateTo({ url: `/pages/tasks/index?view=${event.currentTarget.dataset.target}` }); },
  showSettings() { wx.showModal({ title: "未然Lab", content: "AI 创作者工具平台\n当前版本专注素材处理能力。", showCancel: false }); }
});
