import { useState, useEffect, useRef } from 'react'
import { Refresh, ExternalLink } from '../assets/icons'

type OfficeState = 'checking' | 'not-installed' | 'installing' | 'ready' | 'error'

interface SetupProgress {
  step: number
  totalSteps: number
  title: string
  detail: string
  log: string
}

function Office(): React.JSX.Element {
  const [state, setState] = useState<OfficeState>('checking')
  const [devRunning, setDevRunning] = useState(false)
  const [adapterRunning, setAdapterRunning] = useState(false)
  const [port, setPort] = useState(3000)
  const [portInput, setPortInput] = useState('3000')
  const [portInUse, setPortInUse] = useState(false)
  const [wsUrlInput, setWsUrlInput] = useState('ws://localhost:18789')
  const [progress, setProgress] = useState<SetupProgress>({
    step: 0,
    totalSteps: 2,
    title: 'Preparing...',
    detail: '',
    log: ''
  })
  const [error, setError] = useState('')
  const [webviewReady, setWebviewReady] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const webviewRef = useRef<HTMLWebViewElement>(null)

  useEffect(() => {
    checkStatus()
  }, [])

  // Poll status when in ready state
  useEffect(() => {
    if (state !== 'ready') return
    const interval = setInterval(async () => {
      const status = await window.hermesAPI.claw3dStatus()
      setDevRunning(status.devServerRunning)
      setAdapterRunning(status.adapterRunning)
      setPort(status.port)
      setPortInUse(status.portInUse)

    }, 3000)
    return () => clearInterval(interval)
  }, [state])

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [progress.log])

  // Listen for webview load + inject onboarding skip
  useEffect(() => {
    const wv = webviewRef.current as unknown as {
      addEventListener: (e: string, fn: () => void) => void
      removeEventListener: (e: string, fn: () => void) => void
      executeJavaScript?: (code: string) => Promise<unknown>
    }
    if (!wv) return
    const onLoad = (): void => {
      setWebviewReady(true)
      // Skip Claw3D onboarding by setting localStorage flag
      if (wv.executeJavaScript) {
        wv.executeJavaScript(
          `try { localStorage.setItem("claw3d:onboarding:completed", "true") } catch(e) {}`
        ).catch(() => {})
      }
    }
    const onFail = (): void => setWebviewReady(false)
    wv.addEventListener('did-finish-load', onLoad)
    wv.addEventListener('did-fail-load', onFail)
    return () => {
      wv.removeEventListener('did-finish-load', onLoad)
      wv.removeEventListener('did-fail-load', onFail)
    }
  }, [devRunning, port])

  async function checkStatus(): Promise<void> {
    setState('checking')
    const status = await window.hermesAPI.claw3dStatus()
    setDevRunning(status.devServerRunning)
    setAdapterRunning(status.adapterRunning)
    setPort(status.port)
    setPortInput(String(status.port))
    setPortInUse(status.portInUse)
    setWsUrlInput(status.wsUrl || 'ws://localhost:18789')
    if (status.installed) {
      setState('ready')
    } else {
      setState('not-installed')
    }
  }

  async function handleInstall(): Promise<void> {
    setState('installing')
    setError('')

    const cleanup = window.hermesAPI.onClaw3dSetupProgress((p) => {
      setProgress(p)
    })

    try {
      const result = await window.hermesAPI.claw3dSetup()
      cleanup()
      if (result.success) {
        setState('ready')
      } else {
        setError(result.error || 'Setup failed')
        setState('error')
      }
    } catch (err) {
      cleanup()
      setError((err as Error).message || 'Setup failed')
      setState('error')
    }
  }

  async function toggleDevServer(): Promise<void> {
    if (devRunning) {
      await window.hermesAPI.claw3dStopDev()
      setDevRunning(false)
      setWebviewReady(false)
    } else {
      const ok = await window.hermesAPI.claw3dStartDev()
      if (ok) setDevRunning(true)
    }
  }

  async function toggleAdapter(): Promise<void> {
    if (adapterRunning) {
      await window.hermesAPI.claw3dStopAdapter()
      setAdapterRunning(false)
    } else {
      const ok = await window.hermesAPI.claw3dStartAdapter()
      if (ok) setAdapterRunning(true)
    }
  }

  async function handlePortSave(): Promise<void> {
    const newPort = parseInt(portInput, 10)
    if (isNaN(newPort) || newPort < 1024 || newPort > 65535) return
    await window.hermesAPI.claw3dSetPort(newPort)
    setPort(newPort)
    // Re-check if new port is in use
    const status = await window.hermesAPI.claw3dStatus()
    setPortInUse(status.portInUse)
  }

  async function handleWsUrlSave(): Promise<void> {
    const trimmed = wsUrlInput.trim()
    if (!trimmed) return
    await window.hermesAPI.claw3dSetWsUrl(trimmed)
  }

  function refreshWebview(): void {
    const wv = webviewRef.current as unknown as { reload?: () => void }
    if (wv?.reload) wv.reload()
  }

  const percent =
    progress.totalSteps > 0 ? Math.round((progress.step / progress.totalSteps) * 100) : 0

  const claw3dUrl = `http://localhost:${port}`

  // --- Checking ---
  if (state === 'checking') {
    return (
      <div className="settings-container">
        <h1 className="settings-header">Office</h1>
        <div className="office-center">
          <div className="office-spinner" />
          <p className="office-muted">Checking Claw3D status...</p>
        </div>
      </div>
    )
  }

  // --- Not installed ---
  if (state === 'not-installed' || state === 'error') {
    return (
      <div className="settings-container">
        <h1 className="settings-header">Office</h1>
        <div className="office-center">
          <div className="office-setup-card">
            <h2 className="office-setup-title">Set Up Claw3D</h2>
            <p className="office-setup-desc">
              Claw3D is a 3D visualization environment for your Hermes agents. It lets you see your
              agents working in an interactive office space.
            </p>
            <p className="office-setup-desc">
              Click below to automatically download and set up Claw3D. This will clone the
              repository and install all dependencies.
            </p>
            {error && <div className="office-error">{error}</div>}
            <div className="office-setup-actions">
              <button className="btn btn-primary" onClick={handleInstall}>
                Install Claw3D
              </button>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  window.hermesAPI.openExternal('https://github.com/iamlukethedev/Claw3D')
                }
              >
                <ExternalLink size={14} />
                View on GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- Installing ---
  if (state === 'installing') {
    return (
      <div className="settings-container">
        <h1 className="settings-header">Office</h1>
        <div className="office-installing">
          <h2 className="office-install-title">Setting Up Claw3D</h2>

          <div className="install-progress-container">
            <div className="install-progress-bar">
              <div className="install-progress-fill" style={{ width: `${percent}%` }} />
            </div>
            <div className="install-percent">{percent}%</div>
          </div>

          <div className="install-step-info">
            <div className="install-step-title">
              Step {progress.step}/{progress.totalSteps}: {progress.title}
            </div>
            <div className="install-step-detail">{progress.detail}</div>
          </div>

          <div className="install-log" ref={logRef}>
            {progress.log || 'Waiting to start...'}
          </div>
        </div>
      </div>
    )
  }

  // --- Ready state ---
  return (
    <div className="office-ready">
      <div className="office-toolbar">
        <h1 className="office-toolbar-title">Office</h1>
        <div className="office-services">
          <div className="office-service">
            <span className={`office-status-dot ${devRunning ? 'running' : 'stopped'}`} />
            <span className="office-service-label">Dev Server</span>
            <button className="btn btn-secondary btn-sm" onClick={toggleDevServer}>
              {devRunning ? 'Stop' : 'Start'}
            </button>
          </div>
          <div className="office-service">
            <span className={`office-status-dot ${adapterRunning ? 'running' : 'stopped'}`} />
            <span className="office-service-label">Adapter</span>
            <button className="btn btn-secondary btn-sm" onClick={toggleAdapter}>
              {adapterRunning ? 'Stop' : 'Start'}
            </button>
          </div>
          <div className="office-port">
            <label className="office-port-label">Port</label>
            <input
              className="office-port-input"
              type="number"
              min={1024}
              max={65535}
              value={portInput}
              onChange={(e) => setPortInput(e.target.value)}
              onBlur={handlePortSave}
              onKeyDown={(e) => { if (e.key === 'Enter') handlePortSave() }}
            />
          </div>
          <div className="office-port">
            <label className="office-port-label">WS</label>
            <input
              className="office-ws-input"
              type="text"
              value={wsUrlInput}
              onChange={(e) => setWsUrlInput(e.target.value)}
              onBlur={handleWsUrlSave}
              onKeyDown={(e) => { if (e.key === 'Enter') handleWsUrlSave() }}
              placeholder="ws://localhost:18789"
            />
          </div>
          {devRunning && (
            <>
              <button className="btn-ghost office-toolbar-btn" onClick={refreshWebview} title="Refresh">
                <Refresh size={16} />
              </button>
              <button
                className="btn-ghost office-toolbar-btn"
                onClick={() => window.hermesAPI.openExternal(claw3dUrl)}
                title="Open in browser"
              >
                <ExternalLink size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {portInUse && !devRunning && (
        <div className="office-port-warning">
          Port {port} is already in use by another application. Change the port or stop the other process before starting.
        </div>
      )}

      <div className="office-content">
        {devRunning ? (
          <>
            {!webviewReady && (
              <div className="office-loading-overlay">
                <div className="office-spinner" />
                <p className="office-muted">Loading Claw3D...</p>
              </div>
            )}
            <webview
              ref={webviewRef as React.RefObject<HTMLWebViewElement>}
              src={claw3dUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </>
        ) : (
          <div className="office-center">
            <p className="office-muted">Start the Dev Server to view Claw3D</p>
            <button
              className="btn btn-primary"
              onClick={toggleDevServer}
              disabled={portInUse}
            >
              Start Dev Server
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Office
