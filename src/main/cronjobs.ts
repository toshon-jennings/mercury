import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { execFile } from "child_process";
import { HERMES_HOME, HERMES_PYTHON, HERMES_SCRIPT } from "./installer";

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  prompt: string;
  state: "active" | "paused" | "completed";
  enabled: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  repeat: { times: number | null; completed: number } | null;
  deliver: string[];
  skills: string[];
  script: string | null;
}

const JOBS_FILE = join(HERMES_HOME, "cron", "jobs.json");

/**
 * Read cron jobs directly from the jobs.json file for fast listing.
 */
export function listCronJobs(includeDisabled = true): CronJob[] {
  if (!existsSync(JOBS_FILE)) return [];

  try {
    const parsed = JSON.parse(readFileSync(JOBS_FILE, "utf-8"));
    const raw = Array.isArray(parsed) ? parsed : parsed.jobs || [];
    const jobs: CronJob[] = [];

    for (const job of raw) {
      const enabled = job.enabled !== false;
      if (!includeDisabled && !enabled) continue;

      let state: CronJob["state"] = "active";
      if (job.state === "paused" || !enabled) state = "paused";
      else if (job.state === "completed") state = "completed";

      jobs.push({
        id: job.id || "",
        name: job.name || "(unnamed)",
        schedule: job.schedule_display || job.schedule?.value || "?",
        prompt: job.prompt || "",
        state,
        enabled,
        next_run_at: job.next_run_at || null,
        last_run_at: job.last_run_at || null,
        last_status: job.last_status || null,
        last_error: job.last_error || null,
        repeat: job.repeat || null,
        deliver: Array.isArray(job.deliver)
          ? job.deliver
          : job.deliver
            ? [job.deliver]
            : ["local"],
        skills: job.skills || (job.skill ? [job.skill] : []),
        script: job.script || null,
      });
    }

    return jobs;
  } catch {
    return [];
  }
}

/**
 * Run a hermes cron CLI command and return the result.
 */
function runCronCommand(
  args: string[],
): Promise<{ success: boolean; output: string; error?: string }> {
  return new Promise((resolve) => {
    execFile(
      HERMES_PYTHON,
      [HERMES_SCRIPT, "cron", ...args],
      { cwd: join(HERMES_HOME, "hermes-agent"), timeout: 15000 },
      (err, stdout, stderr) => {
        if (err) {
          resolve({
            success: false,
            output: stdout || "",
            error: stderr || err.message,
          });
        } else {
          resolve({ success: true, output: stdout || "" });
        }
      },
    );
  });
}

export async function createCronJob(
  schedule: string,
  prompt?: string,
  name?: string,
  deliver?: string,
): Promise<{ success: boolean; error?: string }> {
  const args = ["create", schedule];
  if (prompt) args.push(prompt);
  if (name) args.push("--name", name);
  if (deliver) args.push("--deliver", deliver);

  const result = await runCronCommand(args);
  return { success: result.success, error: result.error };
}

export async function removeCronJob(
  jobId: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await runCronCommand(["remove", jobId]);
  return { success: result.success, error: result.error };
}

export async function pauseCronJob(
  jobId: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await runCronCommand(["pause", jobId]);
  return { success: result.success, error: result.error };
}

export async function resumeCronJob(
  jobId: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await runCronCommand(["resume", jobId]);
  return { success: result.success, error: result.error };
}

export async function triggerCronJob(
  jobId: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await runCronCommand(["run", jobId]);
  return { success: result.success, error: result.error };
}
