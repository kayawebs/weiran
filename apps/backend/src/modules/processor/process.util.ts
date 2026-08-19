import { spawn } from "node:child_process";

export class ProcessExecutionError extends Error {
  constructor(message: string, readonly stderr: string) {
    super(message);
  }
}

/** Executes an allow-listed binary without a shell, so user-provided values cannot become shell syntax. */
export async function runProgram(binary: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { shell: false, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("error", (error) => reject(new ProcessExecutionError(`Unable to run ${binary}: ${error.message}`, stderr)));
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new ProcessExecutionError(`${binary} exited with code ${code}`, stderr));
    });
  });
}
