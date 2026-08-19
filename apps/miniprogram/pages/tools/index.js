const catalog = require("../../utils/tool-catalog");

Page({
  data: { categories: catalog.categories },
  openTool(event) {
    const tool = catalog.getTool(event.currentTarget.dataset.id);
    if (!tool) return;
    if (!tool.enabled) return wx.showToast({ title: `${tool.name}即将推出`, icon: "none" });
    wx.navigateTo({ url: tool.path });
  }
});
