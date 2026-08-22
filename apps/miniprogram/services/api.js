const publicErrorMessages = {
  RATE_LIMITED: "请求过于频繁，请稍后重试",
  UNAUTHENTICATED: "登录状态已失效，请重新操作",
  VALIDATION_ERROR: "提交的信息格式不正确",
  INVALID_DOLA_URL: "请输入公开的 Dola Thread 链接",
  INVALID_SOURCE_URL: "请输入所选平台的有效公开分享链接",
  DOLA_NO_VIDEO: "该公开 Thread 中没有找到可下载视频",
  SOURCE_NO_VIDEO: "该公开链接中没有找到可下载视频",
  DOLA_CLEAN_SOURCE_UNAVAILABLE: "原始无水印视频暂时不可用",
  CLEAN_SOURCE_UNAVAILABLE: "原始视频暂时不可用",
  DOLA_EXTRACTION_FAILED: "暂时无法解析该 Dola Thread",
  SOURCE_RESOLVE_FAILED: "暂时无法解析该素材页面",
  SOURCE_DELIVERY_FAILED: "源视频暂时无法下载",
  SOURCE_TICKET_INVALID: "下载链接已失效，请重新解析",
  VIDEO_FLOW_MIGRATED: "旧版视频任务已迁移到即时素材扫描"
};

function publicErrorMessage(code) {
  return publicErrorMessages[code] || "请求暂时无法完成，请稍后重试";
}

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
          const code = response.data && response.data.code;
          const error = new Error(publicErrorMessage(code));
          error.statusCode = response.statusCode;
          error.code = code;
          reject(error);
        }
      },
      fail: reject
    });
  });
}

function mediaUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const app = getApp();
  return `${app.globalData.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
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
  resolveSources: (platform, url) => request("/v1/sources/resolve", "POST", { platform, url }),
  createTask: (payload) => request("/v1/tasks", "POST", payload),
  listTasks: (limit = 50) => request(`/v1/tasks?limit=${limit}`, "GET"),
  getTask: (taskId) => request(`/v1/tasks/${taskId}`, "GET"),
  getResultUrl: (taskId) => request(`/v1/tasks/${taskId}/result-url`, "GET"),
  uploadAsset,
  mimeTypeForFilename,
  mediaUrl
};
