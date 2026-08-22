const api = require("../../../services/api");

const fallbackPlatforms = [{
  id: "dola",
  name: "Dola",
  description: "提取公开 Thread 中的全部原画视频",
  urlPlaceholder: "https://www.dola.com/thread/..."
}];

function durationLabel(duration) {
  if (duration === null || duration === undefined) return "";
  const seconds = Math.round(duration);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

Page({
  data: {
    platforms: fallbackPlatforms,
    selectedPlatform: "dola",
    sourceUrl: "",
    placeholder: fallbackPlatforms[0].urlPlaceholder,
    submitting: false,
    results: [],
    resultCount: 0,
    expiresText: "",
    downloadingIndex: -1,
    previewingIndex: -1
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
    if (platform) this.setData({ selectedPlatform: platform.id, placeholder: platform.urlPlaceholder, sourceUrl: "", results: [], resultCount: 0, previewingIndex: -1 });
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
      if (this.data.selectedPlatform === "dreamina" && !/^https:\/\/dreamina\.capcut\.com\/ai-tool\/work-detail\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/.test(url)) {
        throw new Error("请输入公开的 Dreamina 作品详情链接");
      }
      if (this.data.selectedPlatform === "jimeng" && !/^https:\/\/jimeng\.jianying\.com\/(?:s\/[A-Za-z0-9_-]+|ai-tool\/work-detail\/[A-Za-z0-9_-]+)\/?(?:\?.*)?$/.test(url)) {
        throw new Error("请输入公开的即梦分享链接");
      }
      this.setData({ submitting: true });
      const resolved = await api.resolveSources(this.data.selectedPlatform, url);
      const results = (resolved.videos || []).map((video, index) => ({
        ...video,
        index,
        coverUrl: video.coverUrl ? api.mediaUrl(video.coverUrl) : "",
        previewUrl: api.mediaUrl(video.previewPath),
        downloadUrl: api.mediaUrl(video.downloadPath),
        qualityText: video.height ? `${video.height}P` : (video.quality || "原画").toUpperCase(),
        sizeText: video.width && video.height ? `${video.width}×${video.height}` : "",
        durationText: durationLabel(video.duration)
      }));
      this.setData({
        results,
        resultCount: results.length,
        expiresText: `链接将在 ${Math.round(resolved.expiresInSeconds / 60)} 分钟后失效`,
        previewingIndex: -1
      });
      wx.showToast({ title: `找到 ${results.length} 个视频`, icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "提交失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },

  togglePreview(event) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({ previewingIndex: this.data.previewingIndex === index ? -1 : index });
  },

  saveResult(event) {
    const index = Number(event.currentTarget.dataset.index);
    const result = this.data.results[index];
    if (!result || this.data.downloadingIndex >= 0) return;
    this.setData({ downloadingIndex: index });
    wx.downloadFile({
      url: result.downloadUrl,
      success: ({ statusCode, tempFilePath }) => {
        if (statusCode !== 200 && statusCode !== 206) return wx.showToast({ title: "视频下载失败，请稍后重试", icon: "none" });
        wx.saveVideoToPhotosAlbum({
          filePath: tempFilePath,
          success: () => wx.showToast({ title: "已保存到相册" }),
          fail: () => wx.showToast({ title: "请授权保存到相册", icon: "none" })
        });
      },
      fail: () => wx.showToast({ title: "视频下载失败，请稍后重试", icon: "none" }),
      complete: () => this.setData({ downloadingIndex: -1 })
    });
  }
});
