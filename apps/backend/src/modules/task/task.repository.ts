import type { Pool, PoolClient } from "pg";
import type { TaskEvent, TaskRecord, TaskStatus, TaskType } from "./task.types.js";

type Queryable = Pool | PoolClient;

type TaskRow = {
  id: string;
  user_id: string;
  task_type: TaskType;
  status: TaskStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error_code: string | null;
  error_message: string | null;
  attempt_count: number;
  created_at: Date;
  updated_at: Date;
};

const taskSelect = `
  SELECT id, user_id, task_type, status, input, output, error_code, error_message,
         attempt_count, created_at, updated_at
  FROM tasks`;

const taskReturning = `id, user_id, task_type, status, input, output, error_code, error_message,
  attempt_count, created_at, updated_at`;

function toTask(row: TaskRow): TaskRecord {
  return {
    id: row.id, userId: row.user_id, taskType: row.task_type, status: row.status,
    input: row.input, output: row.output, errorCode: row.error_code,
    errorMessage: row.error_message, attemptCount: row.attempt_count,
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}

export class TaskRepository {
  constructor(private readonly db: Queryable) {}

  async create(task: Pick<TaskRecord, "id" | "userId" | "taskType" | "input">): Promise<TaskRecord> {
    const result = await this.db.query<TaskRow>(`INSERT INTO tasks (id, user_id, task_type, input)
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING ${taskReturning}`, [task.id, task.userId, task.taskType, JSON.stringify(task.input)]);
    return toTask(result.rows[0]!);
  }

  async findById(taskId: string, userId?: string): Promise<TaskRecord | null> {
    const condition = userId ? " WHERE id = $1 AND user_id = $2" : " WHERE id = $1";
    const values = userId ? [taskId, userId] : [taskId];
    const result = await this.db.query<TaskRow>(`${taskSelect}${condition}`, values);
    return result.rows[0] ? toTask(result.rows[0]) : null;
  }

  async listForUser(userId: string, limit: number): Promise<TaskRecord[]> {
    const result = await this.db.query<TaskRow>(`${taskSelect}
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2`, [userId, limit]);
    return result.rows.map(toTask);
  }

  async markProcessing(taskId: string): Promise<TaskRecord | null> {
    const result = await this.db.query<TaskRow>(`UPDATE tasks
      SET status = 'PROCESSING', attempt_count = attempt_count + 1, updated_at = now(),
          error_code = NULL, error_message = NULL
      WHERE id = $1 AND status IN ('PENDING', 'PROCESSING')
      RETURNING ${taskReturning}`, [taskId]);
    return result.rows[0] ? toTask(result.rows[0]) : null;
  }

  async markPendingRetry(taskId: string, message: string): Promise<void> {
    await this.db.query(`UPDATE tasks SET status = 'PENDING', updated_at = now(), error_message = $2 WHERE id = $1 AND status = 'PROCESSING'`, [taskId, message]);
  }

  async markSuccess(taskId: string, output: Record<string, unknown>): Promise<TaskRecord> {
    const result = await this.db.query<TaskRow>(`UPDATE tasks SET status = 'SUCCESS', output = $2::jsonb, updated_at = now(),
          error_code = NULL, error_message = NULL
      WHERE id = $1 AND status = 'PROCESSING'
      RETURNING ${taskReturning}`, [taskId, JSON.stringify(output)]);
    if (!result.rows[0]) throw new Error(`Task ${taskId} cannot transition to SUCCESS`);
    return toTask(result.rows[0]);
  }

  async markFailed(taskId: string, code: string, message: string): Promise<void> {
    await this.db.query(`UPDATE tasks
      SET status = 'FAILED', error_code = $2, error_message = $3, updated_at = now()
      WHERE id = $1 AND status IN ('PENDING', 'PROCESSING')`, [taskId, code, message]);
  }

  async addEvent(taskId: string, status: TaskStatus, message: string, metadata: Record<string, unknown> = {}): Promise<void> {
    await this.db.query(`INSERT INTO task_events (task_id, status, message, metadata)
      VALUES ($1, $2, $3, $4::jsonb)`, [taskId, status, message, JSON.stringify(metadata)]);
  }

  async listEvents(taskId: string): Promise<TaskEvent[]> {
    const result = await this.db.query<{
      id: string; task_id: string; status: TaskStatus; message: string;
      metadata: Record<string, unknown>; created_at: Date;
    }>(`SELECT id, task_id, status, message, metadata, created_at
      FROM task_events WHERE task_id = $1 ORDER BY created_at ASC`, [taskId]);
    return result.rows.map((row) => ({
      id: row.id, taskId: row.task_id, status: row.status, message: row.message,
      metadata: row.metadata, createdAt: row.created_at
    }));
  }
}
