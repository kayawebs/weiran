import { marketConfig, type Locale } from "../config/market";

export type ToolCategoryId = "download" | "image" | "video" | "creator";
export type ToolStatus = "live" | "planned";

type LocalizedText = Record<Locale, string>;

export type ToolDefinition = {
  id: string;
  category: ToolCategoryId;
  status: ToolStatus;
  path: string;
  mark: string;
  logo?: string;
  title: LocalizedText;
  shortTitle: LocalizedText;
  description: LocalizedText;
  seoDescription: LocalizedText;
  tags: LocalizedText[];
};

export type ToolCategory = {
  id: ToolCategoryId;
  path: string;
  index: string;
  title: LocalizedText;
  eyebrow: LocalizedText;
  description: LocalizedText;
};

export function localize(text: LocalizedText): string {
  return text[marketConfig.locale];
}

const text = (en: string, zh: string): LocalizedText => ({ en, "zh-CN": zh });

export const toolCategories: ToolCategory[] = [
  {
    id: "download",
    path: "/download",
    index: "01",
    title: text("Download & extract", "素材下载与提取"),
    eyebrow: text("SOURCE ACQUISITION", "素材获取"),
    description: text("Recover original creator assets from supported AI and publishing platforms.", "从已支持的 AI 与内容平台获取原始创作素材。")
  },
  {
    id: "image",
    path: "/image",
    index: "02",
    title: text("Image tools", "图片工具"),
    eyebrow: text("IMAGE WORKBENCH", "图片工作台"),
    description: text("Clean, enhance, convert, and prepare images for the next creative step.", "清理、增强、转换图片，为下一步创作做好准备。")
  },
  {
    id: "video",
    path: "/video",
    index: "03",
    title: text("Video tools", "视频工具"),
    eyebrow: text("VIDEO WORKBENCH", "视频工作台"),
    description: text("Compress, convert, trim, and repurpose creator video without a full editor.", "无需完整剪辑软件，完成压缩、转换、裁剪和再利用。")
  },
  {
    id: "creator",
    path: "/creator",
    index: "04",
    title: text("Creator utilities", "创作辅助"),
    eyebrow: text("PUBLISHING UTILITIES", "发布辅助"),
    description: text("Practical helpers for subtitles, covers, formats, and publishing workflows.", "面向字幕、封面、尺寸与发布流程的实用工具。")
  }
];

export const tools: ToolDefinition[] = [
  {
    id: "dola-video",
    category: "download",
    status: "live",
    path: "/download/dola",
    mark: "D",
    logo: "/logos/dola.png",
    title: text("Dola video downloader", "Dola 视频下载"),
    shortTitle: text("Dola videos", "Dola 视频"),
    description: text("Find every clean source video in a public Dola thread and download the original MP4.", "解析公开 Dola Thread 中的全部无水印源视频并下载原始 MP4。"),
    seoDescription: text("Download original Dola AI videos from public thread links with preview and multi-video support.", "从公开 Thread 链接下载 Dola AI 原始视频，支持预览和多视频结果。"),
    tags: [text("Multiple videos", "多视频"), text("Original MP4", "原始 MP4"), text("Instant scan", "即时解析")]
  },
  {
    id: "jimeng-video", category: "download", status: "planned", path: "/download/jimeng", mark: "JM", logo: "/logos/jimeng.png",
    title: text("Jimeng / Seedance downloader", "即梦 / Seedance 下载"), shortTitle: text("Jimeng / Seedance", "即梦 / Seedance"),
    description: text("Prepare original Jimeng and Seedance creator videos from public share links.", "从公开分享链接获取即梦与 Seedance 创作者原始视频。"),
    seoDescription: text("A dedicated Jimeng and Seedance source download workspace for AI creators.", "面向 AI 创作者的即梦与 Seedance 专属素材下载工作台。"),
    tags: [text("AI video", "AI 视频"), text("Share link", "分享链接")]
  },
  {
    id: "dreamina-video", category: "download", status: "planned", path: "/download/dreamina", mark: "DR", logo: "/logos/jimeng.png",
    title: text("Dreamina / CapCut downloader", "Dreamina / 剪映下载"), shortTitle: text("Dreamina / CapCut", "Dreamina / 剪映"),
    description: text("Resolve public Dreamina and CapCut AI creation links into reusable source media.", "解析公开 Dreamina 与剪映 AI 创作链接，获取可再利用的源素材。"),
    seoDescription: text("A dedicated Dreamina and CapCut AI video source downloader.", "Dreamina 与剪映 AI 视频专属素材下载工具。"),
    tags: [text("Seedance", "Seedance"), text("AI video", "AI 视频")]
  },
  {
    id: "doubao-video", category: "download", status: "planned", path: "/download/doubao", mark: "DB", logo: "/logos/doubao.png",
    title: text("Doubao video downloader", "豆包视频下载"), shortTitle: text("Doubao", "豆包"),
    description: text("Extract creator-ready video assets from supported public Doubao share links.", "从受支持的豆包公开分享链接提取可继续创作的视频素材。"),
    seoDescription: text("A dedicated Doubao AI video source download tool for creators.", "面向创作者的豆包 AI 视频专属素材下载工具。"),
    tags: [text("AI video", "AI 视频"), text("Public links", "公开链接")]
  },
  {
    id: "vibes-video", category: "download", status: "planned", path: "/download/vibes", mark: "VB", logo: "/logos/meta.png",
    title: text("Meta Vibes downloader", "Meta Vibes 下载"), shortTitle: text("Meta Vibes", "Meta Vibes"),
    description: text("Collect original media from public Meta AI Vibes posts.", "从公开 Meta AI Vibes 内容中获取原始媒体。"),
    seoDescription: text("A dedicated Meta AI Vibes video download workspace.", "Meta AI Vibes 视频专属下载工作台。"),
    tags: [text("Meta AI", "Meta AI"), text("Video", "视频")]
  },
  {
    id: "gemini-flow-video", category: "download", status: "planned", path: "/download/gemini-flow", mark: "GF", logo: "/logos/flow.png",
    title: text("Gemini Flow video downloader", "Gemini Flow 视频下载"), shortTitle: text("Gemini Flow", "Gemini Flow"),
    description: text("Prepare supported Gemini, Flow, and Veo video outputs for creator workflows.", "获取受支持的 Gemini、Flow 与 Veo 视频输出，用于后续创作。"),
    seoDescription: text("A dedicated Gemini Flow and Veo video download tool for AI creators.", "面向 AI 创作者的 Gemini Flow 与 Veo 视频下载工具。"),
    tags: [text("Veo", "Veo"), text("Google AI", "Google AI")]
  },
  {
    id: "sora-video", category: "download", status: "planned", path: "/download/sora", mark: "SO", logo: "/logos/openai.svg",
    title: text("Sora video downloader", "Sora 视频下载"), shortTitle: text("Sora", "Sora"),
    description: text("A dedicated source workflow for supported public Sora creations.", "面向受支持的公开 Sora 作品提供专属素材获取流程。"),
    seoDescription: text("A dedicated Sora AI video source download workspace.", "Sora AI 视频专属素材下载工作台。"),
    tags: [text("OpenAI", "OpenAI"), text("AI video", "AI 视频")]
  },
  {
    id: "kling-video", category: "download", status: "planned", path: "/download/kling", mark: "KL", logo: "/logos/kling.png",
    title: text("Kling video downloader", "可灵视频下载"), shortTitle: text("Kling", "可灵"),
    description: text("Prepare original Kling AI video assets from supported public links.", "从受支持的公开链接获取可灵 AI 原始视频素材。"),
    seoDescription: text("A dedicated Kling AI video download tool for creators.", "面向创作者的可灵 AI 视频专属下载工具。"),
    tags: [text("AI video", "AI 视频"), text("Creator source", "创作源素材")]
  },
  {
    id: "hailuo-video", category: "download", status: "planned", path: "/download/hailuo", mark: "HL", logo: "/logos/hailuo.png",
    title: text("Hailuo video downloader", "海螺视频下载"), shortTitle: text("Hailuo", "海螺"),
    description: text("Resolve supported Hailuo AI share links into reusable video assets.", "将受支持的海螺 AI 分享链接解析为可再利用的视频素材。"),
    seoDescription: text("A dedicated Hailuo AI video download tool.", "海螺 AI 视频专属下载工具。"),
    tags: [text("AI video", "AI 视频"), text("Share link", "分享链接")]
  },
  {
    id: "dola-images", category: "download", status: "planned", path: "/download/dola-images", mark: "DI", logo: "/logos/dola.png",
    title: text("Dola image extractor", "Dola 图片提取"), shortTitle: text("Dola images", "Dola 图片"),
    description: text("Extract every original image attached to a public Dola thread.", "提取公开 Dola Thread 中的全部原始图片。"),
    seoDescription: text("Extract and download original images from a public Dola thread.", "从公开 Dola Thread 提取并下载原始图片。"),
    tags: [text("Multiple images", "多图片"), text("Original quality", "原始画质")]
  },
  {
    id: "batch-download", category: "download", status: "planned", path: "/download/batch", mark: "ZIP",
    title: text("Batch source downloader", "批量素材下载"), shortTitle: text("Batch download", "批量下载"),
    description: text("Resolve multiple supported links and package results into one organized download.", "批量解析多个受支持链接，并将结果整理为一次下载。"),
    seoDescription: text("Batch download supported AI creator media links in one workflow.", "在一个流程中批量下载受支持的 AI 创作者素材链接。"),
    tags: [text("Multiple links", "多链接"), text("ZIP", "ZIP")]
  },
  {
    id: "tiktok-video", category: "download", status: "planned", path: "/download/tiktok", mark: "TK", logo: "/logos/tiktok.png",
    title: text("TikTok source downloader", "TikTok 素材下载"), shortTitle: text("TikTok", "TikTok"),
    description: text("Prepare creator-authorized media from supported public TikTok links.", "从受支持的 TikTok 公开链接获取已获授权的创作素材。"),
    seoDescription: text("A dedicated TikTok public source downloader for authorized creator workflows.", "面向已授权创作流程的 TikTok 公开素材专属下载工具。"),
    tags: [text("Public links", "公开链接"), text("Creator source", "创作源素材")]
  },
  {
    id: "douyin-video", category: "download", status: "planned", path: "/download/douyin", mark: "DY", logo: "/logos/douyin.png",
    title: text("Douyin source downloader", "抖音素材下载"), shortTitle: text("Douyin", "抖音"),
    description: text("Prepare creator-authorized media from supported public Douyin links.", "从受支持的抖音公开链接获取已获授权的创作素材。"),
    seoDescription: text("A dedicated Douyin public source downloader for authorized creator workflows.", "面向已授权创作流程的抖音公开素材专属下载工具。"),
    tags: [text("Short links", "短链接"), text("Video", "视频")]
  },
  {
    id: "xiaohongshu-media", category: "download", status: "planned", path: "/download/xiaohongshu", mark: "XHS", logo: "/logos/xiaohongshu.png",
    title: text("Xiaohongshu source downloader", "小红书素材下载"), shortTitle: text("Xiaohongshu / RedNote", "小红书"),
    description: text("Prepare supported public Xiaohongshu videos and image posts for authorized workflows.", "从受支持的小红书公开视频与图文笔记获取已授权素材。"),
    seoDescription: text("A dedicated Xiaohongshu and RedNote public media source downloader.", "小红书与 RedNote 公开媒体专属素材下载工具。"),
    tags: [text("Video", "视频"), text("Image posts", "图文")]
  },
  {
    id: "kuaishou-video", category: "download", status: "planned", path: "/download/kuaishou", mark: "KS", logo: "/logos/kuaishou.png",
    title: text("Kuaishou source downloader", "快手素材下载"), shortTitle: text("Kuaishou", "快手"),
    description: text("Prepare creator-authorized media from supported public Kuaishou links.", "从受支持的快手公开链接获取已获授权的创作素材。"),
    seoDescription: text("A dedicated Kuaishou public source downloader for authorized creator workflows.", "面向已授权创作流程的快手公开素材专属下载工具。"),
    tags: [text("Public links", "公开链接"), text("Video", "视频")]
  },
  {
    id: "image-watermark", category: "image", status: "live", path: "/image/watermark-remover", mark: "IW",
    title: text("Image watermark remover", "图片去水印"), shortTitle: text("Watermark remover", "图片去水印"),
    description: text("Mark an authorized image region and rebuild or blur the selected background.", "框选已获授权图片中的指定区域，并通过修复或模糊完成清理。"),
    seoDescription: text("Remove a selected watermark region from authorized images with inpainting or blur.", "使用图像修复或模糊移除已授权图片中的指定水印区域。"),
    tags: [text("Inpainting", "智能修复"), text("Region select", "区域框选")]
  },
  {
    id: "gemini-watermark", category: "image", status: "planned", path: "/image/gemini-watermark-remover", mark: "GW", logo: "/logos/flow.png",
    title: text("Gemini image watermark remover", "Gemini 图片水印清理"), shortTitle: text("Gemini watermark", "Gemini 水印清理"),
    description: text("A browser-first workflow for cleaning the visible Gemini mark from images you created.", "在浏览器中清理您自行创作图片上的可见 Gemini 标记。"),
    seoDescription: text("A dedicated Gemini visible image watermark cleanup tool for authorized content.", "面向已授权内容的 Gemini 可见图片水印专属清理工具。"),
    tags: [text("Local processing", "本地处理"), text("Batch ready", "批量预留")]
  },
  {
    id: "background-remover", category: "image", status: "planned", path: "/image/background-remover", mark: "BG",
    title: text("Background remover", "图片背景移除"), shortTitle: text("Background remover", "背景移除"),
    description: text("Create a clean transparent subject for covers, product shots, and composites.", "为封面、商品图和合成素材生成干净透明主体。"),
    seoDescription: text("Remove image backgrounds for creator assets and transparent exports.", "移除创作者图片背景并导出透明素材。"),
    tags: [text("Transparent PNG", "透明 PNG"), text("Portraits", "主体抠图")]
  },
  {
    id: "image-upscaler", category: "image", status: "planned", path: "/image/upscaler", mark: "2X",
    title: text("AI image upscaler", "AI 图片增强"), shortTitle: text("Image upscaler", "图片增强"),
    description: text("Increase useful resolution while protecting edges, texture, and text.", "提升可用分辨率，同时保护边缘、纹理与文字。"),
    seoDescription: text("Upscale creator images while preserving useful visual detail.", "增强创作者图片并保留有效视觉细节。"),
    tags: [text("2× / 4×", "2× / 4×"), text("Detail recovery", "细节恢复")]
  },
  {
    id: "image-converter", category: "image", status: "planned", path: "/image/converter", mark: "IMG",
    title: text("Image format converter", "图片格式转换"), shortTitle: text("Image converter", "图片格式转换"),
    description: text("Convert PNG, JPG, WebP, and creator-ready image formats in batches.", "批量转换 PNG、JPG、WebP 等创作常用图片格式。"),
    seoDescription: text("Convert common creator image formats in a focused browser tool.", "使用轻量浏览器工具转换常见创作者图片格式。"),
    tags: [text("PNG", "PNG"), text("JPG", "JPG"), text("WebP", "WebP")]
  },
  {
    id: "video-compressor", category: "video", status: "planned", path: "/video/compressor", mark: "CMP",
    title: text("Video compressor", "视频压缩"), shortTitle: text("Video compressor", "视频压缩"),
    description: text("Reduce file size for publishing while keeping the output visually useful.", "在保持画面可用性的同时减小发布文件体积。"),
    seoDescription: text("Compress creator video for faster uploads and publishing.", "压缩创作者视频，提升上传和发布效率。"),
    tags: [text("MP4", "MP4"), text("Size target", "目标体积")]
  },
  {
    id: "video-converter", category: "video", status: "planned", path: "/video/converter", mark: "CVT",
    title: text("Video format converter", "视频格式转换"), shortTitle: text("Video converter", "视频格式转换"),
    description: text("Convert creator media into the format and codec required by the next platform.", "将创作素材转换为下一平台所需的格式与编码。"),
    seoDescription: text("Convert creator video formats and codecs in one focused workflow.", "在一个专注流程中转换创作者视频格式与编码。"),
    tags: [text("MP4", "MP4"), text("WebM", "WebM"), text("MOV", "MOV")]
  },
  {
    id: "video-trimmer", category: "video", status: "planned", path: "/video/trimmer", mark: "CUT",
    title: text("Video trimmer", "视频裁剪"), shortTitle: text("Video trimmer", "视频裁剪"),
    description: text("Cut useful segments without opening a full editing timeline.", "无需打开完整剪辑时间线，快速截取可用片段。"),
    seoDescription: text("Trim creator video into reusable segments in the browser.", "在浏览器中将创作者视频裁剪为可再利用片段。"),
    tags: [text("Quick cut", "快速裁剪"), text("No timeline", "无需时间线")]
  },
  {
    id: "audio-extractor", category: "video", status: "planned", path: "/video/audio-extractor", mark: "AUD",
    title: text("Audio extractor", "视频提取音频"), shortTitle: text("Extract audio", "提取音频"),
    description: text("Extract the audio track from creator video for transcription or reuse.", "从创作者视频中提取音轨，用于转写或后续利用。"),
    seoDescription: text("Extract audio tracks from creator video files.", "从创作者视频文件中提取音轨。"),
    tags: [text("MP3", "MP3"), text("WAV", "WAV")]
  },
  {
    id: "subtitles", category: "creator", status: "planned", path: "/creator/subtitles", mark: "CC",
    title: text("AI subtitle generator", "AI 字幕生成"), shortTitle: text("Subtitles", "字幕生成"),
    description: text("Transcribe speech and export editable captions for creator video.", "转写语音并为创作者视频导出可编辑字幕。"),
    seoDescription: text("Generate editable subtitles for creator video workflows.", "为创作者视频流程生成可编辑字幕。"),
    tags: [text("SRT", "SRT"), text("Editable", "可编辑")]
  },
  {
    id: "cover-maker", category: "creator", status: "planned", path: "/creator/cover-maker", mark: "CVR",
    title: text("Creator cover maker", "创作者封面制作"), shortTitle: text("Cover maker", "封面制作"),
    description: text("Turn a frame or image into a platform-ready publishing cover.", "将视频画面或图片制作成适配平台的发布封面。"),
    seoDescription: text("Create publishing-ready covers from creator images and video frames.", "使用创作者图片和视频画面制作发布封面。"),
    tags: [text("Templates", "模板"), text("Platform sizes", "平台尺寸")]
  },
  {
    id: "aspect-ratio", category: "creator", status: "planned", path: "/creator/aspect-ratio", mark: "9:16",
    title: text("Aspect ratio adapter", "画面比例适配"), shortTitle: text("Aspect ratio", "比例适配"),
    description: text("Reframe media for vertical, square, landscape, and publishing-safe layouts.", "将素材适配竖屏、方形、横屏与平台安全区域。"),
    seoDescription: text("Adapt creator media to common social and publishing aspect ratios.", "将创作者素材适配常见社交与发布画面比例。"),
    tags: [text("9:16", "9:16"), text("1:1", "1:1"), text("16:9", "16:9")]
  }
];

export function categoryById(id: ToolCategoryId): ToolCategory {
  return toolCategories.find((category) => category.id === id)!;
}

export function toolsByCategory(id: ToolCategoryId): ToolDefinition[] {
  return tools.filter((tool) => tool.category === id);
}

export function toolByPath(pathname: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.path === pathname);
}

export function liveTools(): ToolDefinition[] {
  return tools.filter((tool) => tool.status === "live");
}
