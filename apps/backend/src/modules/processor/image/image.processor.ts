import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runProgram } from "../process.util.js";
import type { WatermarkRegion } from "../../task/task.types.js";

export class ImageWatermarkProcessor {
  private readonly scriptPath = fileURLToPath(new URL("./inpaint.py", import.meta.url));

  async remove(inputFile: string, outputFile: string, regions: WatermarkRegion[], mode: "inpaint" | "blur"): Promise<void> {
    await access(this.scriptPath);
    await runProgram("python3", [
      this.scriptPath, "--input", inputFile, "--output", outputFile,
      "--regions", JSON.stringify(regions), "--mode", mode
    ]);
  }
}
