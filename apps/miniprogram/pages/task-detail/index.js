const api = require("../../services/api");

const labels = { PENDING: "正在排队", PROCESSING: "正在处理", SUCCESS: "处理完成", FAILED: "处理失败" };

function resultKind(mimeType, fallbackKind) {
  if ((mimeType || "").startsWith("image/")) return "image";
  if ((mimeType || "").startsWith("video/")) return "video";
  return fallbackKind;
}

Page({
  data: {
    taskId: "",
    kind: "image",
    status: "PENDING",
    statusLabel: "正在排队",
    statusHint: "请保持小程序打开",
    statusClass: "pending",
    events: [],
    results: [],
    resultsLoaded: false,
    downloadingIndex: -1,
    errorMessage: ""
  },

  onLoad(query) {
    this.setData({ taskId: query.id, kind: query.kind || "image" });
    this.refresh();
  },

  onUnload() {
    if (this.timer) clearTimeout(this.timer);
  },

  async refresh() {
    try {
      const task = await api.getTask(this.data.taskId);
      const status = task.status;
      const processingHint = task.taskType === "VIDEO_WATERMARK_REMOVE"
        ? "正在解析平台素材并生成下载结果"
        : "正在清理水印区域，请稍候";
      this.setData({
        status,
        statusLabel: labels[status],
        statusClass: status.toLowerCase(),
        events: task.events || [],
        errorMessage: task.error ? task.error.message : "",
        statusHint: status === "PROCESSING" ? processingHint : status === "PENDING" ? "任务即将开始" : ""
      });
      if (status === "SUCCESS") return this.loadResults();
      if (status !== "FAILED") this.timer = setTimeout(() => this.refresh(), 2000);
    } catch (error) {
      this.timer = setTimeout(() => this.refresh(), 4000);
    }
  },

  async loadResults() {
    if (this.data.resultsLoaded) return;
    try {
      const response = await api.getResultUrl(this.data.taskId);
      const files = response.files && response.files.length ? response.files : [response];
      const results = files.map((file, index) => ({
        ...file,
        index,
        kind: resultKind(file.mimeType, this.data.kind),
        label: file.title || `${this.data.kind === "image" ? "图片" : "视频"} ${index + 1}`,
        tempFilePath: ""
      }));
      this.setData({ results, resultsLoaded: true });
    } catch (error) {
      wx.showToast({ title: error.message || "获取结果失败", icon: "none" });
    }
  },

  saveResult(event) {
    const index = Number(event.currentTarget.dataset.index);
    const result = this.data.results[index];
    if (!result || this.data.downloadingIndex >= 0) return;
    if (result.tempFilePath) return this.saveToAlbum(result);

    this.setData({ downloadingIndex: index });
    wx.downloadFile({
      url: result.downloadUrl,
      success: ({ statusCode, tempFilePath }) => {
        if (statusCode !== 200) {
          wx.showToast({ title: "结果下载失败，请稍后重试", icon: "none" });
          return;
        }
        const path = `results[${index}].tempFilePath`;
        this.setData({ [path]: tempFilePath });
        this.saveToAlbum({ ...result, tempFilePath });
      },
      fail: () => wx.showToast({ title: "结果下载失败，请稍后重试", icon: "none" }),
      complete: () => this.setData({ downloadingIndex: -1 })
    });
  },

  saveToAlbum(result) {
    const save = result.kind === "image" ? wx.saveImageToPhotosAlbum : wx.saveVideoToPhotosAlbum;
    save({
      filePath: result.tempFilePath,
      success: () => wx.showToast({ title: "已保存" }),
      fail: () => wx.showToast({ title: "请授权保存到相册", icon: "none" })
    });
  },

  openTaskHistory() {
    wx.navigateTo({ url: "/pages/tasks/index?view=files" });
  },

  goBack() {
    wx.navigateBack();
  }
});
