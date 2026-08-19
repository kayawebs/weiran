const api = require("../../../services/api");
const { normalizeRegion } = require("../../../utils/regions");

Page({
  data: { filePath: "", file: null, submitting: false, mode: "inpaint", region: { x: "0.72", y: "0.86", width: "0.20", height: "0.08" } },
  chooseImage() {
    wx.chooseMedia({ count: 1, mediaType: ["image"], sourceType: ["album", "camera"], success: ({ tempFiles }) => {
      const file = tempFiles[0];
      this.setData({ filePath: file.tempFilePath, file });
    }});
  },
  onRegionInput(event) { this.setData({ [`region.${event.currentTarget.dataset.field}`]: event.detail.value }); },
  onModeChange(event) { this.setData({ mode: event.detail.value }); },
  async submit() {
    try {
      const region = normalizeRegion(this.data.region);
      this.setData({ submitting: true });
      const filename = this.data.filePath.split("/").pop() || "image.jpg";
      const assetId = await api.uploadAsset({ filePath: this.data.filePath, filename, mimeType: api.mimeTypeForFilename(filename, "image/jpeg"), byteSize: this.data.file.size });
      const task = await api.createTask({ taskType: "IMAGE_WATERMARK_REMOVE", input: { sourceAssetId: assetId, regions: [region], mode: this.data.mode } });
      wx.redirectTo({ url: `/pages/task-detail/index?id=${task.id}&kind=image` });
    } catch (error) { wx.showToast({ title: error.message || "提交失败", icon: "none" }); } finally { this.setData({ submitting: false }); }
  }
});
