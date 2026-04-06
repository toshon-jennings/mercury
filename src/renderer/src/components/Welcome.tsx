import { useState } from "react";
import icon from "../assets/icon.png";
import { ArrowRight, Refresh, Copy, Globe, Check, Spinner } from "../assets/icons";
import { INSTALL_CMD } from "../constants";

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
  const [testing, setTesting] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  async function handleConnectRemote(): Promise<void> {
    const url = remoteUrl.trim();
    if (!url) {
      setRemoteError("Please enter a URL.");
      return;
    }
    setTesting(true);
    setRemoteError(null);
    try {
      const ok = await window.hermesAPI.testRemoteConnection(url);
      if (ok) {
        await window.hermesAPI.setConnectionConfig("remote", url);
        onRecheck();
      } else {
        setRemoteError("Could not reach Hermes at this URL. Is it running?");
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
        <img src={icon} height={40} width={40} alt="" />
        <h1 className="welcome-title">Connect to Remote Hermes</h1>
        <p className="welcome-subtitle">
          Enter the URL of a Hermes API server running on your network or cloud.
        </p>

        <div className="welcome-actions">
          <div className="welcome-terminal-option">
            <p className="welcome-terminal-label">Hermes API URL</p>
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
          </div>

          {remoteError && (
            <p className="welcome-remote-error">{remoteError}</p>
          )}

          <button
            className="btn btn-primary welcome-button"
            onClick={handleConnectRemote}
            disabled={testing}
          >
            {testing ? (
              <>
                Testing connection...
                <Spinner size={16} className="animate-spin" />
              </>
            ) : (
              <>
                Connect
                <Check size={16} />
              </>
            )}
          </button>

          <button
            className="btn btn-secondary welcome-recheck-btn"
            onClick={() => setShowRemote(false)}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen welcome-screen">
      <img src={icon} height={40} width={40} alt="" />

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
