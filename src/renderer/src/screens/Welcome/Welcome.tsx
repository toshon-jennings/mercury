import { useState } from "react";
import HermesLogo from "../../components/common/HermesLogo";
import {
  ArrowRight,
  Refresh,
  Copy,
  Globe,
  Spinner,
} from "../../assets/icons";
import { INSTALL_CMD } from "../../constants";

interface WelcomeProps {
  error: string | null;
  onStart: () => void;
  onRecheck: () => void;
}

function Welcome({
  error,
  onStart,
  onRecheck,
}: WelcomeProps): React.JSX.Element {
  const [showRemote, setShowRemote] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [remoteApiKey, setRemoteApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  async function handleConnectRemote(): Promise<void> {
    const url = remoteUrl.trim();
    const key = remoteApiKey.trim();
    if (!url) {
      setRemoteError("Please enter a URL.");
      return;
    }
    setTesting(true);
    setRemoteError(null);
    try {
      const ok = await window.hermesAPI.testRemoteConnection(url, key);
      if (ok) {
        await window.hermesAPI.setConnectionConfig("remote", url, key);
        onRecheck();
      } else {
        setRemoteError(
          "Could not reach Hermes at this URL. Check the URL and API key.",
        );
      }
    } catch {
      setRemoteError("Connection test failed.");
    } finally {
      setTesting(false);
    }
  }

  if (showRemote) {
    return (
      <div className="screen welcome-screen">
        <HermesLogo size={36} />
        <h1 className="welcome-title" style={{ fontSize: 22 }}>
          Connect to Remote Hermes
        </h1>
        <p className="welcome-subtitle" style={{ marginBottom: 24 }}>
          Enter the URL of a running Hermes API server.
        </p>

        <div className="welcome-remote-card">
          <label className="welcome-remote-label">Server URL</label>
          <input
            type="url"
            className="welcome-remote-input"
            placeholder="http://192.168.1.100:8642"
            value={remoteUrl}
            onChange={(e) => setRemoteUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConnectRemote();
            }}
            autoFocus
          />

          <label
            className="welcome-remote-label"
            style={{ marginTop: 12 }}
          >
            API Key (optional)
          </label>
          <input
            type="password"
            className="welcome-remote-input"
            placeholder="Bearer token (API_SERVER_KEY)"
            value={remoteApiKey}
            onChange={(e) => setRemoteApiKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConnectRemote();
            }}
          />

          <div className="welcome-remote-row" style={{ marginTop: 12 }}>
            <button
              className="btn btn-primary"
              onClick={handleConnectRemote}
              disabled={testing}
              style={{ whiteSpace: "nowrap", width: "100%" }}
            >
              {testing ? (
                <>
                  Testing...
                  <Spinner size={14} className="animate-spin" />
                </>
              ) : (
                "Connect"
              )}
            </button>
          </div>
          {remoteError && <p className="welcome-remote-error">{remoteError}</p>}
          <p className="welcome-remote-hint">
            Leave the key empty if the server accepts unauthenticated
            requests (e.g. via SSH tunnel to localhost).
          </p>
        </div>

        <button
          className="btn-ghost"
          onClick={() => setShowRemote(false)}
          style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="screen welcome-screen">
      <HermesLogo size={40} />

      {error ? (
        <>
          <h1 className="welcome-title">Installation Issue</h1>
          <p className="welcome-subtitle">{error}</p>

          <div className="welcome-actions">
            <button
              className="btn btn-primary welcome-button"
              onClick={onStart}
            >
              Retry Installation
              <Refresh size={16} />
            </button>

            <div className="welcome-divider">
              <span>or</span>
            </div>

            <div className="welcome-terminal-option">
              <p className="welcome-terminal-label">
                Install via terminal, then come back:
              </p>
              <div className="welcome-terminal-box">
                <code>{INSTALL_CMD}</code>
                <button
                  className="btn-ghost welcome-copy-btn"
                  onClick={() => navigator.clipboard.writeText(INSTALL_CMD)}
                  title="Copy to clipboard"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <button
              className="btn btn-secondary welcome-recheck-btn"
              onClick={onRecheck}
            >
              I&apos;ve installed it — check again
            </button>

            <div className="welcome-divider">
              <span>or</span>
            </div>

            <button
              className="btn btn-secondary welcome-recheck-btn"
              onClick={() => setShowRemote(true)}
            >
              <Globe size={16} />
              Connect to Remote Hermes
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="welcome-title">Welcome to Hermes</h1>
          <p className="welcome-subtitle">
            Your self-improving AI assistant that runs locally on your machine.
            Private, powerful, and always learning.
          </p>
          <button className="btn btn-primary welcome-button" onClick={onStart}>
            Get Started
            <ArrowRight size={16} />
          </button>
          <p className="welcome-note">
            This will install required components (~2 GB)
          </p>

          <div className="welcome-divider">
            <span>or</span>
          </div>

          <button
            className="btn btn-secondary welcome-recheck-btn"
            onClick={() => setShowRemote(true)}
          >
            <Globe size={16} />
            Connect to Remote Hermes
          </button>
        </>
      )}
    </div>
  );
}

export default Welcome;
