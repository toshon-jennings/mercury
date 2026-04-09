import { useState, useEffect, useCallback } from "react";
import { Plus, Trash, Refresh, X, Play, Pause, Alert } from "../assets/icons";

interface CronJob {
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

function Schedules(): React.JSX.Element {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newSchedule, setNewSchedule] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newDeliver, setNewDeliver] = useState("");

  const loadJobs = useCallback(async (): Promise<void> => {
    setLoading(true);
    const list = await window.hermesAPI.listCronJobs(true);
    setJobs(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  async function handleCreate(): Promise<void> {
    if (!newSchedule.trim()) return;
    setActionInProgress("creating");
    setError("");
    const result = await window.hermesAPI.createCronJob(
      newSchedule.trim(),
      newPrompt.trim() || undefined,
      newName.trim() || undefined,
      newDeliver.trim() || undefined,
    );
    setActionInProgress(null);
    if (result.success) {
      setShowCreate(false);
      setNewName("");
      setNewSchedule("");
      setNewPrompt("");
      setNewDeliver("");
      await loadJobs();
    } else {
      setError(result.error || "Failed to create job");
    }
  }

  async function handleRemove(jobId: string): Promise<void> {
    setActionInProgress(jobId);
    setError("");
    const result = await window.hermesAPI.removeCronJob(jobId);
    setActionInProgress(null);
    setConfirmDelete(null);
    if (result.success) {
      await loadJobs();
    } else {
      setError(result.error || "Failed to remove job");
    }
  }

  async function handleToggle(job: CronJob): Promise<void> {
    setActionInProgress(job.id);
    setError("");
    const result =
      job.state === "paused"
        ? await window.hermesAPI.resumeCronJob(job.id)
        : await window.hermesAPI.pauseCronJob(job.id);
    setActionInProgress(null);
    if (result.success) {
      await loadJobs();
    } else {
      setError(result.error || "Failed to update job");
    }
  }

  async function handleTrigger(jobId: string): Promise<void> {
    setActionInProgress(jobId);
    setError("");
    const result = await window.hermesAPI.triggerCronJob(jobId);
    setActionInProgress(null);
    if (result.success) {
      await loadJobs();
    } else {
      setError(result.error || "Failed to trigger job");
    }
  }

  function formatTime(iso: string | null): string {
    if (!iso) return "--";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  if (loading) {
    return (
      <div className="schedules-container">
        <div className="schedules-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="schedules-container">
      {/* Create Modal */}
      {showCreate && (
        <div
          className="skills-detail-overlay"
          onClick={() => setShowCreate(false)}
        >
          <div className="schedules-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedules-modal-header">
              <h3>New Scheduled Task</h3>
              <button
                className="btn-ghost"
                onClick={() => setShowCreate(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="schedules-modal-body">
              <div className="schedules-field">
                <label className="schedules-field-label">Name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Daily backup reminder"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="schedules-field">
                <label className="schedules-field-label">
                  Schedule <span className="schedules-required">*</span>
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. 30m, every 2h, 0 9 * * *"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                />
                <div className="schedules-field-hint">
                  Duration (30m, 2h), human (every 2 hours), or cron expression
                </div>
              </div>
              <div className="schedules-field">
                <label className="schedules-field-label">Prompt</label>
                <textarea
                  className="input schedules-textarea"
                  placeholder="Task instruction for the agent..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="schedules-field">
                <label className="schedules-field-label">Deliver to</label>
                <input
                  className="input"
                  type="text"
                  placeholder="local, telegram, discord, signal"
                  value={newDeliver}
                  onChange={(e) => setNewDeliver(e.target.value)}
                />
                <div className="schedules-field-hint">
                  Where to send the result (default: local)
                </div>
              </div>
            </div>
            <div className="schedules-modal-footer">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCreate}
                disabled={
                  !newSchedule.trim() || actionInProgress === "creating"
                }
              >
                {actionInProgress === "creating" ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          className="skills-detail-overlay"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="schedules-modal schedules-modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="schedules-modal-header">
              <h3>Remove Job</h3>
              <button
                className="btn-ghost"
                onClick={() => setConfirmDelete(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="schedules-modal-body">
              <p className="schedules-confirm-text">
                Are you sure you want to remove this scheduled task? This cannot
                be undone.
              </p>
            </div>
            <div className="schedules-modal-footer">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleRemove(confirmDelete)}
                disabled={actionInProgress === confirmDelete}
              >
                {actionInProgress === confirmDelete ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="schedules-header">
        <div>
          <h2 className="schedules-title">Schedules</h2>
          <p className="schedules-subtitle">
            Automate tasks with scheduled agent runs
          </p>
        </div>
        <div className="schedules-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={loadJobs}>
            <Refresh size={14} />
            Refresh
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={14} />
            New Task
          </button>
        </div>
      </div>

      {error && (
        <div className="skills-error">
          {error}
          <button className="btn-ghost" onClick={() => setError("")}>
            <X size={14} />
          </button>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="schedules-empty">
          <p className="schedules-empty-text">No scheduled tasks yet</p>
          <p className="schedules-empty-hint">
            Create a scheduled task to run your agent automatically on a timer
          </p>
          <button
            className="btn btn-primary "
            style={{ marginTop: 12 }}
            onClick={() => setShowCreate(true)}
          >
            <Plus size={14} />
            Create your first task
          </button>
        </div>
      ) : (
        <div className="schedules-list">
          {jobs.map((job) => (
            <div key={job.id} className="schedules-card">
              <div className="schedules-card-top">
                <div className="schedules-card-info">
                  <div className="schedules-card-name">{job.name}</div>
                  <div className="schedules-card-schedule">{job.schedule}</div>
                </div>
                <div className="schedules-card-actions">
                  <span
                    className={`schedules-badge schedules-badge-${job.state}`}
                  >
                    {job.state}
                  </span>
                  {job.state !== "completed" && (
                    <button
                      className="btn-ghost schedules-action-btn"
                      title={job.state === "paused" ? "Resume" : "Pause"}
                      onClick={() => handleToggle(job)}
                      disabled={actionInProgress === job.id}
                    >
                      {job.state === "paused" ? (
                        <Play size={14} />
                      ) : (
                        <Pause size={14} />
                      )}
                    </button>
                  )}
                  {job.state === "active" && (
                    <button
                      className="btn-ghost schedules-action-btn"
                      title="Run now"
                      onClick={() => handleTrigger(job.id)}
                      disabled={actionInProgress === job.id}
                    >
                      <Refresh size={14} />
                    </button>
                  )}
                  <button
                    className="btn-ghost schedules-action-btn schedules-action-danger"
                    title="Remove"
                    onClick={() => setConfirmDelete(job.id)}
                    disabled={actionInProgress === job.id}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>

              {job.prompt && (
                <div className="schedules-card-prompt">{job.prompt}</div>
              )}

              <div className="schedules-card-meta">
                <span>Next: {formatTime(job.next_run_at)}</span>
                {job.last_run_at && (
                  <span>
                    Last: {formatTime(job.last_run_at)}
                    {job.last_status && job.last_status !== "ok" && (
                      <span className="schedules-card-error-icon">
                        <Alert size={12} />
                      </span>
                    )}
                  </span>
                )}
                {job.repeat && job.repeat.times && (
                  <span>
                    Runs: {job.repeat.completed}/{job.repeat.times}
                  </span>
                )}
                {job.deliver.length > 0 &&
                  !(job.deliver.length === 1 && job.deliver[0] === "local") && (
                    <span>Deliver: {job.deliver.join(", ")}</span>
                  )}
                {job.skills.length > 0 && (
                  <span>Skills: {job.skills.join(", ")}</span>
                )}
              </div>

              {job.last_error && (
                <div className="schedules-card-error">{job.last_error}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Schedules;
