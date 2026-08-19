import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../../config/env.js";
import { MEDIA_QUEUE } from "./task.constants.js";

export { MEDIA_QUEUE } from "./task.constants.js";

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
export const taskQueue = new Queue<{ taskId: string }>(MEDIA_QUEUE, { connection });

export async function enqueueTask(taskId: string): Promise<void> {
  await taskQueue.add("process-task", { taskId }, {
    jobId: taskId,
    attempts: env.TASK_MAX_ATTEMPTS,
    backoff: { type: "exponential", delay: 2_000 },
    removeOnComplete: 500,
    removeOnFail: 1_000
  });
}

export async function closeTaskQueue(): Promise<void> {
  await taskQueue.close();
  await connection.quit();
}
