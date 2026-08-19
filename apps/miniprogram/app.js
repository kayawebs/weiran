const api = require("./services/api");
const marketConfig = require("./config/market");

App({
  globalData: {
    // 替换为已备案且配置到小程序 request 合法域名的 API 地址。
    apiBaseUrl: "http://127.0.0.1:3000",
    marketConfig
  },
  onLaunch() {
    this.ensureSession().catch(() => undefined);
  },
  ensureSession(force = false) {
    if (!force && wx.getStorageSync("accessToken")) return Promise.resolve(wx.getStorageSync("accessToken"));
    if (this.loginPromise) return this.loginPromise;
    this.loginPromise = new Promise((resolve, reject) => {
      wx.login({
        success: async ({ code }) => {
          try {
            if (!code) throw new Error("未获取到微信登录凭证");
            const session = await api.exchangeWechatCode(code);
            wx.setStorageSync("accessToken", session.accessToken);
            resolve(session.accessToken);
          } catch (error) { reject(error); }
        },
        fail: reject
      });
    }).finally(() => { this.loginPromise = null; });
    return this.loginPromise;
  }
});
