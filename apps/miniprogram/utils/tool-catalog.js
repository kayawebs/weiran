const categories = [
  {
    id: "media-processing",
    name: "素材处理",
    description: "清理和优化已有素材",
    tools: [
      { id: "image-watermark", name: "图片去水印", description: "框选区域，智能修复图片", icon: "图", tone: "blue", taskType: "IMAGE_WATERMARK_REMOVE", path: "/pages/tools/image-watermark/index", enabled: true },
      { id: "video-watermark", name: "视频去水印", description: "选择平台，粘贴链接自动处理", icon: "影", tone: "purple", taskType: "VIDEO_WATERMARK_REMOVE", path: "/pages/tools/video-watermark/index", enabled: true }
    ]
  },
  {
    id: "media-acquisition",
    name: "素材获取",
    description: "集中管理授权素材来源",
    tools: [
      { id: "source-download", name: "素材获取", description: "授权链接解析与素材获取", icon: "取", tone: "cyan", taskType: "SOURCE_DOWNLOAD", enabled: false, badge: "即将推出" }
    ]
  },
  {
    id: "creative-assist",
    name: "创作辅助",
    description: "帮助完成后续创作加工",
    tools: [
      { id: "subtitle", name: "字幕生成", description: "识别语音并生成字幕", icon: "字", tone: "orange", enabled: false, badge: "规划中" },
      { id: "cover", name: "封面制作", description: "快速生成内容封面", icon: "封", tone: "pink", enabled: false, badge: "规划中" },
      { id: "format-convert", name: "格式转换", description: "转换媒体格式与尺寸", icon: "转", tone: "green", enabled: false, badge: "规划中" }
    ]
  }
];

const allTools = categories.reduce((list, category) => list.concat(category.tools), []);
function getTool(id) { return allTools.find((tool) => tool.id === id); }
function getToolByTaskType(taskType) { return allTools.find((tool) => tool.taskType === taskType); }
function getCommonTools() { return allTools.filter((tool) => tool.enabled).slice(0, 2); }

module.exports = { categories, allTools, getTool, getToolByTaskType, getCommonTools };
