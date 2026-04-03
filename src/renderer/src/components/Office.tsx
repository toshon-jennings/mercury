import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, Refresh } from '../assets/icons'

type Status = 'checking' | 'not-installed' | 'running' | 'error'

function Office(): React.JSX.Element {
  const [status, setStatus] = useState<Status>('checking')
  const [url, setUrl] = useState('http://localhost:3000')
  const [error, setError] = useState('')

  const checkClaw3d = useCallback(async () => {
    setStatus('checking')
    try {
      await fetch('http://localhost:3000', { method: 'HEAD', mode: 'no-cors' })
      setStatus('running')
    } catch {
      setStatus('not-installed')
    }
  }, [])

  useEffect(() => {
    checkClaw3d()
  }, [checkClaw3d])

  const openExternal = useCallback(() => {
    window.hermesAPI.openExternal(url)
  }, [url])

  if (status === 'checking') {
    return (
      <div className="office-container">
        <div className="office-loading"><div className="loading-spinner" /></div>
      </div>
    )
  }

  if (status === 'not-installed' || status === 'error') {
    return (
      <div className="office-container">
        <div className="office-setup">
          <div className="office-setup-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <path d="M9 22v-4h6v4" />
              <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
            </svg>
          </div>
          <h2 className="office-setup-title">3D Office</h2>
          <p className="office-setup-subtitle">
            Claw3D brings your agents to life in an interactive 3D workspace.
            Watch agents work, run standups, review code, and monitor pipelines — all from a virtual office.
          </p>

          {error && <div className="office-setup-error">{error}</div>}

          <div className="office-setup-steps">
            <div className="office-setup-step">
              <span className="office-setup-step-num">1</span>
              <div>
                <div className="office-setup-step-title">Clone Claw3D</div>
                <code className="office-setup-code">git clone https://github.com/iamlukethedev/Claw3D.git</code>
              </div>
            </div>
            <div className="office-setup-step">
              <span className="office-setup-step-num">2</span>
              <div>
                <div className="office-setup-step-title">Install and start</div>
                <code className="office-setup-code">cd Claw3D && npm install && npm run dev</code>
              </div>
            </div>
            <div className="office-setup-step">
              <span className="office-setup-step-num">3</span>
              <div>
                <div className="office-setup-step-title">Start Hermes adapter</div>
                <code className="office-setup-code">npm run hermes-adapter</code>
              </div>
            </div>
            <div className="office-setup-step">
              <span className="office-setup-step-num">4</span>
              <div>
                <div className="office-setup-step-title">Connect</div>
                <span className="office-setup-step-hint">Choose "Hermes backend" in Claw3D and connect to <code>ws://localhost:18789</code></span>
              </div>
            </div>
          </div>

          <div className="office-setup-actions">
            <button className="btn btn-primary" onClick={checkClaw3d}>
              <Refresh size={14} />
              Check Connection
            </button>
            <button className="btn btn-secondary" onClick={() => window.hermesAPI.openExternal('https://github.com/iamlukethedev/Claw3D')}>
              <ExternalLink size={14} />
              View on GitHub
            </button>
          </div>

          <div className="office-setup-url">
            <label className="office-setup-url-label">Claw3D URL</label>
            <input
              className="input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:3000"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="office-container office-container-live">
      <div className="office-toolbar">
        <span className="office-toolbar-status">
          <span className="office-toolbar-dot" />
          Connected to Claw3D
        </span>
        <div className="office-toolbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={checkClaw3d}>
            <Refresh size={13} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={openExternal}>
            <ExternalLink size={13} />
            Open in Browser
          </button>
        </div>
      </div>
      <webview
        src={url}
        className="office-webview"
        /* @ts-ignore - webview attributes */
        allowpopups="true"
      />
    </div>
  )
}

export default Office
