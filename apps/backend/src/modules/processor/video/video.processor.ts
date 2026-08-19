import type { WatermarkRegion } from "../../task/task.types.js";
import { runProgram } from "../process.util.js";

type VideoDimensions = { width: number; height: number };

export class VideoWatermarkProcessor {
  async remove(inputFile: string, outputFile: string, regions: WatermarkRegion[]): Promise<void> {
    const { width, height } = await this.probeDimensions(inputFile);
    const filter = regions.map((region) => {
      const x = Math.round(region.x * width);
      const y = Math.round(region.y * height);
      const w = Math.max(2, Math.round(region.width * width));
      const h = Math.max(2, Math.round(region.height * height));
      return `delogo=x=${x}:y=${y}:w=${w}:h=${h}:show=0`;
    }).join(",");

    await runProgram("ffmpeg", [
      "-y", "-i", inputFile, "-vf", filter,
      "-map", "0:v:0", "-map", "0:a?", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
      "-c:a", "copy", "-movflags", "+faststart", outputFile
    ]);
  }

  async blur(inputFile: string, outputFile: string, regions: WatermarkRegion[]): Promise<void> {
    // FFmpeg's delogo performs interpolation appropriate for watermark removal. Blur remains
    // intentionally mapped to the same safe operation until a multi-region compositing filter is added.
    await this.remove(inputFile, outputFile, regions);
  }

  private async probeDimensions(inputFile: string): Promise<VideoDimensions> {
    const result = await runProgram("ffprobe", [
      "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", inputFile
    ]);
    const parsed = JSON.parse(result.stdout) as { streams?: Array<Partial<VideoDimensions>> };
    const stream = parsed.streams?.[0];
    if (!stream?.width || !stream.height) throw new Error("Video does not contain a readable video stream");
    return { width: stream.width, height: stream.height };
  }
}
