const api = require("../../../services/api");

const fallbackPlatforms = [{
  id: "dola",
  name: "Dola",
  description: "提取公开 Thread 中的全部原画视频",
  urlPlaceholder: "https://www.dola.com/thread/..."
}];

Page({
  data: {
    platforms: fallbackPlatforms,
    selectedPlatform: "dola",
    sourceUrl: "",
    placeholder: fallbackPlatforms[0].urlPlaceholder,
    submitting: false
  },

  onLoad() { this.loadPlatforms(); },

  async loadPlatforms() {
    try {
      const capabilities = await api.getCapabilities();
      const platforms = capabilities.videoWatermarkPlatforms || fallbackPlatforms;
      if (!platforms.length) return;
      const selected = platforms.find((item) => item.id === this.data.selectedPlatform) || platforms[0];
      this.setData({ platforms, selectedPlatform: selected.id, placeholder: selected.urlPlaceholder });
    } catch (_) { /* The bundled Dola definition keeps the page usable offline. */ }
  },

  selectPlatform(event) {
    const platform = this.data.platforms.find((item) => item.id === event.currentTarget.dataset.id);
    if (platform) this.setData({ selectedPlatform: platform.id, placeholder: platform.urlPlaceholder, sourceUrl: "" });
  },

  onUrlInput(event) { this.setData({ sourceUrl: event.detail.value }); },

  pasteUrl() {
    wx.getClipboardData({
      success: ({ data }) => this.setData({ sourceUrl: (data || "").trim() }),
      fail: () => wx.showToast({ title: "无法读取剪贴板", icon: "none" })
    });
  },

  async submit() {
    const url = this.data.sourceUrl.trim();
    try {
      if (!url) throw new Error("请粘贴视频页面链接");
      if (this.data.selectedPlatform === "dola" && !/^https:\/\/(www\.)?dola\.com\/thread\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/.test(url)) {
        throw new Error("请输入公开的 Dola Thread 链接");
      }
      this.setData({ submitting: true });
      const task = await api.createTask({
        taskType: "VIDEO_WATERMARK_REMOVE",
        input: { platform: this.data.selectedPlatform, url }
      });
      wx.redirectTo({ url: `/pages/task-detail/index?id=${task.id}&kind=video` });
    } catch (error) {
      wx.showToast({ title: error.message || "提交失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
