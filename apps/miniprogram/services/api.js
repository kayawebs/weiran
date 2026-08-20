function rawRequest(path, method, data, token) {
  const app = getApp();
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBaseUrl}${path}`,
      method,
      data,
      header: {
        ...(data === undefined ? {} : { "content-type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) resolve(response.data);
        else {
          const error = new Error(response.data && response.data.message ? response.data.message : "请求失败");
          error.statusCode = response.statusCode;
          reject(error);
        }
      },
      fail: reject
    });
  });
}

function request(path, method, data, options = {}) {
  if (options.auth === false) return rawRequest(path, method, data);
  const app = getApp();
  const token = wx.getStorageSync("accessToken");
  if (!token) {
    // In local development the API may intentionally use its server-side fallback.
    // In production a failed login is followed by a normal 401 response.
    if (options.loginAttempted) return rawRequest(path, method, data);
    return app.ensureSession().catch(() => undefined).then(() => request(path, method, data, { ...options, loginAttempted: true }));
  }
  return rawRequest(path, method, data, token).catch((error) => {
    if (error.statusCode !== 401 || options.retried) throw error;
    wx.removeStorageSync("accessToken");
    return app.ensureSession(true).then(() => request(path, method, data, { ...options, retried: true }));
  });
}

function uploadAsset({ filePath, filename, mimeType, byteSize }) {
  return request("/v1/assets/upload-url", "POST", { filename, mimeType, byteSize })
    .then(({ assetId, upload }) => new Promise((resolve, reject) => {
      wx.uploadFile({
        url: upload.url,
        filePath,
        name: "file",
        formData: upload.fields,
        success(response) {
          if (response.statusCode >= 200 && response.statusCode < 300) request(`/v1/assets/${assetId}/complete`, "POST").then(() => resolve(assetId)).catch(reject);
          else reject(new Error("素材上传失败"));
        },
        fail: reject
      });
    }));
}

function mimeTypeForFilename(filename, fallback) {
  const extension = (filename.split(".").pop() || "").toLowerCase();
  return ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" })[extension] || fallback;
}

module.exports = {
  getCapabilities: () => request("/v1/capabilities", "GET", undefined, { auth: false }),
  exchangeWechatCode: (code) => request("/v1/auth/wechat", "POST", { code }, { auth: false }),
  createTask: (payload) => request("/v1/tasks", "POST", payload),
  listTasks: (limit = 50) => request(`/v1/tasks?limit=${limit}`, "GET"),
  getTask: (taskId) => request(`/v1/tasks/${taskId}`, "GET"),
  getResultUrl: (taskId) => request(`/v1/tasks/${taskId}/result-url`, "GET"),
  uploadAsset,
  mimeTypeForFilename
};
