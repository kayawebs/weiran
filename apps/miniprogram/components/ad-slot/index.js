const marketConfig = require("../../config/market");

Component({
  properties: { placement: { type: String, value: "" } },
  data: { visible: false, unitId: "" },
  lifetimes: {
    attached() {
      const unitId = marketConfig.ads.units[this.properties.placement] || "";
      this.setData({ visible: marketConfig.ads.provider === "wechat" && Boolean(unitId), unitId });
    }
  },
  methods: {
    onAdError() { this.setData({ visible: false }); }
  }
});
