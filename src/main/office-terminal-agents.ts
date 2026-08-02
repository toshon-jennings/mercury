import { randomUUID } from "crypto";
import WebSocket, { type RawData } from "ws";
import { getClaw3dWsUrl } from "./claw3d";

interface PendingRequest {
  resolve: (payload: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

interface TrackedTerminalSession {
  sessionId: string;
  cwd: string;
  agentId: string | null;
  sessionKey: string | null;
  ended: boolean;
  creating: boolean;
  lastActivityAt: number;
}

interface RpcSuccessFrame {
  type: "res";
  id: string;
  ok: true;
  payload?: unknown;
}

interface RpcErrorFrame {
  type: "res";
  id: string;
  ok: false;
  error?: { code?: string; message?: string };
}

type RpcResponseFrame = RpcSuccessFrame | RpcErrorFrame;

interface AgentsListPayload {
  agents?: Array<{ id?: string }>;
}

interface AgentCreatePayload {
  agentId?: string;
}

const ACTIVITY_UPDATE_THROTTLE_MS = 1500;

export function shouldDispatchTerminalActivityUpdate(input: string): boolean {
  return /[\r\n]/.test(input);
}

function normalizeAdapterWsUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Claw3D websocket URL is empty.");
  }
  const parsed = new URL(trimmed);
  if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
    throw new Error(
      `Unsupported Claw3D websocket protocol: ${parsed.protocol}`,
    );
  }
  return parsed.toString();
}

export class OfficeTerminalAgentBridge {
  private socket: WebSocket | null = null;

  private connected = false;

  private connectingPromise: Promise<void> | null = null;

  private disposed = false;

  private requestCounter = 0;

  private pending = new Map<string, PendingRequest>();

  private sessions = new Map<string, TrackedTerminalSession>();

  dispose(): void {
    this.disposed = true;
    this.connected = false;
    const sock = this.socket;
    this.socket = null;
    if (sock && sock.readyState === WebSocket.OPEN) {
      sock.close();
    }
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Office terminal bridge disposed."));
    }
    this.pending.clear();
  }

  onTerminalStarted(payload: { sessionId: string; cwd: string }): void {
    const tracked: TrackedTerminalSession = {
      sessionId: payload.sessionId,
      cwd: payload.cwd,
      agentId: null,
      sessionKey: null,
      ended: false,
      creating: false,
      lastActivityAt: 0,
    };
    this.sessions.set(payload.sessionId, tracked);
    void this.ensureAgentForSession(payload.sessionId, true);
  }

  onTerminalInput(payload: { sessionId: string; input: string }): void {
    const tracked = this.sessions.get(payload.sessionId);
    if (!tracked || tracked.ended) return;
    if (!shouldDispatchTerminalActivityUpdate(payload.input)) return;
    if (Date.now() - tracked.lastActivityAt < ACTIVITY_UPDATE_THROTTLE_MS)
      return;
    tracked.lastActivityAt = Date.now();

    void this.ensureAgentForSession(payload.sessionId, false)
      .then(() => this.dispatchActivityUpdate(payload.sessionId))
      .catch((error: unknown) => {
        console.warn(
          "[Office Agents] Failed to dispatch terminal activity:",
          error,
        );
      });
  }

  onTerminalEnded(payload: { sessionId: string; exitCode: number }): void {
    const tracked = this.sessions.get(payload.sessionId);
    if (!tracked) return;
    tracked.ended = true;
    void this.deleteAgentForSession(
      payload.sessionId,
      payload.exitCode,
    ).finally(() => {
      this.sessions.delete(payload.sessionId);
    });
  }

  private async dispatchActivityUpdate(sessionId: string): Promise<void> {
    const tracked = this.sessions.get(sessionId);
    if (!tracked || tracked.ended || !tracked.sessionKey) return;
    const locationSuffix = tracked.cwd ? ` in ${tracked.cwd}` : "";
    await this.sendChat(
      tracked.sessionKey,
      `The user executed another terminal command${locationSuffix}. Reply with a short one-sentence status update on current progress.`,
    );
  }

  private async ensureAgentForSession(
    sessionId: string,
    sendKickoff: boolean,
  ): Promise<void> {
    const tracked = this.sessions.get(sessionId);
    if (!tracked || tracked.ended || tracked.agentId || tracked.creating)
      return;
    tracked.creating = true;

    try {
      const payload = (await this.rpc("agents.create", {
        name: `Terminal ${sessionId.slice(-6)}`,
        role: "Terminal Agent",
      })) as AgentCreatePayload;

      const agentId =
        typeof payload?.agentId === "string" ? payload.agentId : "";
      if (!agentId) {
        throw new Error("Adapter returned no agentId for terminal session.");
      }

      if (tracked.ended) {
        await this.rpc("agents.delete", { agentId }).catch(() => {});
        return;
      }

      tracked.agentId = agentId;
      tracked.sessionKey = `agent:${agentId}:main`;

      if (sendKickoff && tracked.sessionKey) {
        const locationSuffix = tracked.cwd ? ` in ${tracked.cwd}` : "";
        await this.sendChat(
          tracked.sessionKey,
          `A Mercury terminal session started${locationSuffix}. Introduce yourself in one sentence and confirm you are tracking this terminal.`,
        );
      }
    } catch (error) {
      console.warn(
        "[Office Agents] Failed to create terminal Office agent:",
        error,
      );
    } finally {
      const current = this.sessions.get(sessionId);
      if (current) current.creating = false;
    }
  }

  private async deleteAgentForSession(
    sessionId: string,
    exitCode: number,
  ): Promise<void> {
    const tracked = this.sessions.get(sessionId);
    if (!tracked || !tracked.agentId) return;
    const agentId = tracked.agentId;
    tracked.agentId = null;
    tracked.sessionKey = null;
    try {
      await this.rpc("agents.delete", {
        agentId,
        reason: `Terminal session ended with code ${exitCode}`,
      });
    } catch (error) {
      console.warn(
        "[Office Agents] Failed deleting terminal Office agent:",
        error,
      );
    }
  }

  private async sendChat(sessionKey: string, message: string): Promise<void> {
    await this.rpc("chat.send", {
      sessionKey,
      message,
      idempotencyKey: randomUUID(),
    });
  }

  private async rpc(method: string, params: unknown): Promise<unknown> {
    await this.ensureConnected();
    return this.sendRpc(method, params);
  }

  private async ensureConnected(): Promise<void> {
    if (this.disposed) throw new Error("Office terminal bridge is disposed.");
    if (this.connected && this.socket?.readyState === WebSocket.OPEN) return;
    if (this.connectingPromise) return this.connectingPromise;

    this.connectingPromise = this.connect().finally(() => {
      this.connectingPromise = null;
    });
    return this.connectingPromise;
  }

  private async connect(): Promise<void> {
    const wsUrl = normalizeAdapterWsUrl(getClaw3dWsUrl());
    const socket = new WebSocket(wsUrl);

    this.socket = socket;
    this.connected = false;

    await new Promise<void>((resolve, reject) => {
      const onOpen = (): void => {
        socket.off("error", onError);
        resolve();
      };
      const onError = (error: Error): void => {
        socket.off("open", onOpen);
        reject(error);
      };
      socket.once("open", onOpen);
      socket.once("error", onError);
    });

    socket.on("message", (data: RawData) => this.handleIncomingMessage(data));
    socket.on("close", () => this.handleSocketClosed());
    socket.on("error", (error: Error) => {
      console.warn("[Office Agents] Adapter websocket error:", error);
    });

    await this.sendRpc("connect", {
      protocol: 3,
      role: "operator",
      scopes: ["operator.admin"],
    });
    this.connected = true;
    await this.reconcileSessionAgents();
  }

  private handleIncomingMessage(data: RawData): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      return;
    }
    if (!parsed || typeof parsed !== "object") return;
    const frame = parsed as Partial<RpcResponseFrame>;
    if (frame.type !== "res" || typeof frame.id !== "string") return;
    const pending = this.pending.get(frame.id);
    if (!pending) return;
    this.pending.delete(frame.id);
    clearTimeout(pending.timeout);

    if (frame.ok === true) {
      pending.resolve((frame as RpcSuccessFrame).payload);
      return;
    }
    const message =
      (frame as RpcErrorFrame).error?.message || "Adapter RPC request failed.";
    pending.reject(new Error(message));
  }

  private handleSocketClosed(): void {
    this.connected = false;
    this.socket = null;
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Adapter websocket disconnected."));
    }
    this.pending.clear();
  }

  private sendRpc(
    method: string,
    params: unknown,
    timeoutMs = 10000,
  ): Promise<unknown> {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Adapter websocket is not connected."));
    }

    const id = `terminal-${Date.now()}-${this.requestCounter++}`;
    const frame = {
      type: "req",
      id,
      method,
      params,
    };

    return new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Adapter RPC timeout for ${method}.`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timeout });
      socket.send(JSON.stringify(frame), (error?: Error) => {
        if (!error) return;
        const pending = this.pending.get(id);
        if (!pending) return;
        clearTimeout(pending.timeout);
        this.pending.delete(id);
        reject(error);
      });
    });
  }

  private async reconcileSessionAgents(): Promise<void> {
    let payload: AgentsListPayload;
    try {
      payload = (await this.sendRpc("agents.list", {})) as AgentsListPayload;
    } catch (error) {
      console.warn("[Office Agents] Failed reconciling Office agents:", error);
      return;
    }

    const activeAgentIds = new Set(
      (payload.agents || [])
        .map((agent) => agent.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    );

    for (const [sessionId, tracked] of this.sessions) {
      if (tracked.agentId && !activeAgentIds.has(tracked.agentId)) {
        tracked.agentId = null;
        tracked.sessionKey = null;
      }
      if (!tracked.ended && !tracked.agentId) {
        await this.ensureAgentForSession(sessionId, true);
      }
    }
  }
}

export const officeTerminalAgentBridge = new OfficeTerminalAgentBridge();
