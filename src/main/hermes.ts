import { ChildProcess, spawn } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { HERMES_HOME, HERMES_REPO, HERMES_PYTHON, HERMES_SCRIPT, getEnhancedPath } from './installer'
import { getModelConfig, readEnv } from './config'

function stripAnsi(str: string): string {
  return str
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1B\][^\x07]*\x07/g, '')
    .replace(/\x1B\(B/g, '')
    .replace(/\r/g, '')
}

interface ChatHandle {
  abort: () => void
  sessionId?: string
}

// Patterns to filter from Hermes CLI output (box drawing chrome)
const NOISE_PATTERNS = [
  /^[╭╰│╮╯─┌┐└┘┤├┬┴┼]/,
  /⚕\s*Hermes/
]

export function sendMessage(
  message: string,
  onChunk: (text: string) => void,
  onDone: (sessionId?: string) => void,
  onError: (error: string) => void,
  profile?: string,
  resumeSessionId?: string
): ChatHandle {
  // Read config from the correct profile
  const mc = getModelConfig(profile)
  const profileEnv = readEnv(profile)

  const args = [HERMES_SCRIPT]
  if (profile && profile !== 'default') {
    args.push('-p', profile)
  }
  args.push('chat', '-q', message, '-Q', '--source', 'desktop')

  // Resume previous session for conversation continuity
  if (resumeSessionId) {
    args.push('--resume', resumeSessionId)
  }

  if (mc.model) {
    args.push('-m', mc.model)
  }

  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    PATH: getEnhancedPath(),
    HOME: homedir(),
    HERMES_HOME: HERMES_HOME,
    PYTHONUNBUFFERED: '1'
  }

  // Map provider → env var for API key
  const PROVIDER_KEY_MAP: Record<string, string> = {
    custom: 'OPENAI_API_KEY',
    lmstudio: '', ollama: '', vllm: '', llamacpp: ''
  }

  const isCustomEndpoint = mc.provider in PROVIDER_KEY_MAP
  if (isCustomEndpoint && mc.baseUrl) {
    env.HERMES_INFERENCE_PROVIDER = 'custom'
    env.OPENAI_BASE_URL = mc.baseUrl.replace(/\/+$/, '')

    // Resolve the correct API key — check profile .env first, then process env
    const keyEnvVar = PROVIDER_KEY_MAP[mc.provider]
    const resolvedKey = keyEnvVar ? (profileEnv[keyEnvVar] || env[keyEnvVar] || '') : 'no-key-required'
    env.OPENAI_API_KEY = resolvedKey || 'no-key-required'

    // Remove cloud provider keys so auto-detection doesn't override
    delete env.OPENROUTER_API_KEY
    delete env.ANTHROPIC_API_KEY
    delete env.ANTHROPIC_TOKEN
    delete env.OPENROUTER_BASE_URL
  }

  const proc = spawn(HERMES_PYTHON, args, {
    cwd: HERMES_REPO,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  let hasOutput = false
  let capturedSessionId = ''

  let outputBuffer = ''

  function processOutput(raw: Buffer): void {
    const text = stripAnsi(raw.toString())
    outputBuffer += text

    // Check for session_id in the accumulated buffer (appears at the end)
    const sidMatch = outputBuffer.match(/session_id:\s*(\S+)/)
    if (sidMatch) {
      capturedSessionId = sidMatch[1]
    }

    // Strip session_id line from the chunk before forwarding
    const cleaned = text.replace(/session_id:\s*\S+\n?/g, '')

    // With -Q mode, minimal filtering — only strip box drawing chrome
    const lines = cleaned.split('\n')
    const result: string[] = []
    for (const line of lines) {
      const t = line.trim()
      if (t && NOISE_PATTERNS.some((p) => p.test(t))) continue
      result.push(line)
    }

    const output = result.join('\n')
    if (output) {
      hasOutput = true
      onChunk(output)
    }
  }

  proc.stdout?.on('data', processOutput)

  proc.stderr?.on('data', (data: Buffer) => {
    const text = stripAnsi(data.toString())
    if (text.trim() && !text.includes('UserWarning') && !text.includes('FutureWarning')) {
      if (/❌|⚠️|Error|Traceback/.test(text)) {
        hasOutput = true
        onChunk(text)
      }
    }
  })

  proc.on('close', (code) => {
    if (code === 0 || hasOutput) {
      onDone(capturedSessionId || undefined)
    } else {
      onError(`Hermes exited with code ${code}`)
    }
  })

  proc.on('error', (err) => {
    onError(err.message)
  })

  return {
    abort: () => {
      proc.kill('SIGTERM')
      setTimeout(() => {
        if (!proc.killed) proc.kill('SIGKILL')
      }, 3000)
    }
  }
}

// Gateway management
let gatewayProcess: ChildProcess | null = null

export function startGateway(): boolean {
  if (gatewayProcess && !gatewayProcess.killed) return false

  gatewayProcess = spawn(HERMES_PYTHON, [HERMES_SCRIPT, 'gateway'], {
    cwd: HERMES_REPO,
    env: {
      ...process.env,
      PATH: getEnhancedPath(),
      HOME: homedir(),
      HERMES_HOME: HERMES_HOME
    },
    stdio: 'ignore',
    detached: true
  })

  gatewayProcess.unref()

  gatewayProcess.on('close', () => {
    gatewayProcess = null
  })

  return true
}

export function stopGateway(): void {
  // Stop our spawned process
  if (gatewayProcess && !gatewayProcess.killed) {
    gatewayProcess.kill('SIGTERM')
    gatewayProcess = null
  }
  // Also kill via PID file (gateway may have been started externally)
  const pidFile = join(HERMES_HOME, 'gateway.pid')
  if (existsSync(pidFile)) {
    try {
      const pid = parseInt(readFileSync(pidFile, 'utf-8').trim(), 10)
      if (!isNaN(pid)) process.kill(pid, 'SIGTERM')
    } catch {
      // already dead
    }
  }
}

export function isGatewayRunning(): boolean {
  // Check in-memory process first
  if (gatewayProcess && !gatewayProcess.killed) return true
  // Fall back to PID file check (gateway started externally or process ref lost)
  const pidFile = join(HERMES_HOME, 'gateway.pid')
  if (!existsSync(pidFile)) return false
  try {
    const pid = parseInt(readFileSync(pidFile, 'utf-8').trim(), 10)
    if (isNaN(pid)) return false
    process.kill(pid, 0) // signal 0 = check if alive
    return true
  } catch {
    return false
  }
}
