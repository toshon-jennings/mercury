import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "./ThemeProvider";
import { SETTINGS_SECTIONS, PROVIDERS, THEME_OPTIONS } from "../constants";

function Settings({ profile }: { profile?: string }): React.JSX.Element {
  const [env, setEnv] = useState<Record<string, string>>({});
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [hermesHome, setHermesHome] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const { theme, setTheme } = useTheme();

  // Hermes engine info
  const [hermesVersion, setHermesVersion] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState("");
  const [doctorOutput, setDoctorOutput] = useState<string | null>(null);
  const [doctorRunning, setDoctorRunning] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);

  // Model config
  const [modelProvider, setModelProvider] = useState("auto");
  const [modelName, setModelName] = useState("");
  const [modelBaseUrl, setModelBaseUrl] = useState("");
  const [modelSaved, setModelSaved] = useState(false);
  const modelLoaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Credential pool state
  const [credPool, setCredPool] = useState<
    Record<string, Array<{ key: string; label: string }>>
  >({});
  const [poolProvider, setPoolProvider] = useState("");
  const [poolNewKey, setPoolNewKey] = useState("");
  const [poolNewLabel, setPoolNewLabel] = useState("");

  const loadConfig = useCallback(async (): Promise<void> => {
    const [envData, home, mc, pool, hVersion, aVersion] = await Promise.all([
      window.hermesAPI.getEnv(profile),
      window.hermesAPI.getHermesHome(profile),
      window.hermesAPI.getModelConfig(profile),
      window.hermesAPI.getCredentialPool(),
      window.hermesAPI.getHermesVersion(),
      window.hermesAPI.getAppVersion(),
    ]);
    setEnv(envData);
    setHermesHome(home);
    setModelProvider(mc.provider);
    setModelName(mc.model);
    setModelBaseUrl(mc.baseUrl);
    setCredPool(pool);
    setHermesVersion(hVersion);
    setAppVersion(aVersion);
    setTimeout(() => {
      modelLoaded.current = true;
    }, 600);
  }, [profile]);

  useEffect(() => {
    modelLoaded.current = false;
    loadConfig();
  }, [loadConfig]);

  // Auto-save model config when values change (debounced)
  const saveModelConfig = useCallback(async () => {
    if (!modelLoaded.current) return;
    await window.hermesAPI.setModelConfig(
      modelProvider,
      modelName,
      modelBaseUrl,
      profile,
    );
    // Auto-save to models library (dedup handled by backend)
    if (modelName.trim()) {
      const displayName = modelName.split("/").pop() || modelName;
      await window.hermesAPI.addModel(
        displayName,
        modelProvider,
        modelName,
        modelBaseUrl,
      );
    }
    setModelSaved(true);
    setTimeout(() => setModelSaved(false), 2000);
  }, [modelProvider, modelName, modelBaseUrl, profile]);

  useEffect(() => {
    if (!modelLoaded.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveModelConfig();
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [modelProvider, modelName, modelBaseUrl, saveModelConfig]);

  async function handleBlur(key: string): Promise<void> {
    const value = env[key] || "";
    await window.hermesAPI.setEnv(key, value, profile);
    setSavedKey(key);
    setTimeout(() => setSavedKey(null), 2000);
  }

  function handleChange(key: string, value: string): void {
    setEnv((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAddPoolKey(): Promise<void> {
    if (!poolProvider || !poolNewKey.trim()) return;
    const existing = credPool[poolProvider] || [];
    const entries = [
      ...existing,
      {
        key: poolNewKey.trim(),
        label: poolNewLabel.trim() || `Key ${existing.length + 1}`,
      },
    ];
    await window.hermesAPI.setCredentialPool(poolProvider, entries);
    setCredPool((prev) => ({ ...prev, [poolProvider]: entries }));
    setPoolNewKey("");
    setPoolNewLabel("");
  }

  async function handleRemovePoolKey(
    provider: string,
    index: number,
  ): Promise<void> {
    const entries = [...(credPool[provider] || [])];
    entries.splice(index, 1);
    await window.hermesAPI.setCredentialPool(provider, entries);
    setCredPool((prev) => ({ ...prev, [provider]: entries }));
  }

  function toggleVisibility(key: string): void {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleDoctor(): Promise<void> {
    setDoctorRunning(true);
    setDoctorOutput(null);
    const output = await window.hermesAPI.runHermesDoctor();
    setDoctorOutput(output);
    setDoctorRunning(false);
  }

  async function handleUpdateHermes(): Promise<void> {
    setUpdating(true);
    setUpdateResult(null);
    const result = await window.hermesAPI.runHermesUpdate();
    setUpdating(false);
    if (result.success) {
      setUpdateResult("Updated successfully!");
      const v = await window.hermesAPI.getHermesVersion();
      setHermesVersion(v);
    } else {
      setUpdateResult(result.error || "Update failed.");
    }
  }

  // Parse "Hermes Agent v0.7.0 (2026.4.3) Project: ... Python: 3.11.15 OpenAI SDK: 2.30.0 Update available: ..."
  const parsedVersion = (() => {
    if (!hermesVersion) return null;
    const v = hermesVersion;
    const version = v.match(/v([\d.]+)/)?.[1] || "";
    const date = v.match(/\(([\d.]+)\)/)?.[1] || "";
    const python = v.match(/Python:\s*([\d.]+)/)?.[1] || "";
    const sdk = v.match(/OpenAI SDK:\s*([\d.]+)/)?.[1] || "";
    const updateMatch = v.match(/Update available:\s*(.+?)(?:\s*—|$)/);
    const updateInfo = updateMatch?.[1]?.trim() || null;
    return { version, date, python, sdk, updateInfo };
  })();

  const isCustomProvider = modelProvider === "custom";

  return (
    <div className="settings-container">
      <h1 className="settings-header">Settings</h1>

      <div className="settings-section">
        <div className="settings-section-title">Hermes Agent</div>
        <div className="settings-hermes-info">
          <div className="settings-hermes-row">
            <div className="settings-hermes-detail">
              <span className="settings-hermes-label">Engine</span>
              <span className="settings-hermes-value">
                {parsedVersion ? `v${parsedVersion.version}` : "Not detected"}
              </span>
            </div>
            {parsedVersion?.date && (
              <div className="settings-hermes-detail">
                <span className="settings-hermes-label">Released</span>
                <span className="settings-hermes-value">
                  {parsedVersion.date}
                </span>
              </div>
            )}
            <div className="settings-hermes-detail">
              <span className="settings-hermes-label">Desktop</span>
              <span className="settings-hermes-value">
                v{appVersion || "—"}
              </span>
            </div>
            {parsedVersion?.python && (
              <div className="settings-hermes-detail">
                <span className="settings-hermes-label">Python</span>
                <span className="settings-hermes-value">
                  {parsedVersion.python}
                </span>
              </div>
            )}
            {parsedVersion?.sdk && (
              <div className="settings-hermes-detail">
                <span className="settings-hermes-label">OpenAI SDK</span>
                <span className="settings-hermes-value">
                  {parsedVersion.sdk}
                </span>
              </div>
            )}
            <div className="settings-hermes-detail">
              <span className="settings-hermes-label">Home</span>
              <span className="settings-hermes-value settings-hermes-path">
                {hermesHome || "—"}
              </span>
            </div>
          </div>
          {parsedVersion?.updateInfo && (
            <div className="settings-hermes-update-badge">
              {parsedVersion.updateInfo}
            </div>
          )}
          <div className="settings-hermes-actions">
            {parsedVersion?.updateInfo ? (
              <button
                className="btn btn-primary "
                onClick={handleUpdateHermes}
                disabled={updating}
              >
                {updating ? "Updating..." : "Update Engine"}
              </button>
            ) : (
              <button className="btn btn-secondary" disabled>
                Up to date
              </button>
            )}
            <button
              className="btn btn-secondary "
              onClick={handleDoctor}
              disabled={doctorRunning}
            >
              {doctorRunning ? "Running..." : "Run Doctor"}
            </button>
          </div>
          {updateResult && (
            <div
              className={`settings-hermes-result ${updateResult.includes("success") ? "success" : "error"}`}
            >
              {updateResult}
            </div>
          )}
          {doctorOutput && (
            <pre className="settings-hermes-doctor">{doctorOutput}</pre>
          )}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Appearance</div>
        <div className="settings-field">
          <label className="settings-field-label">Theme</label>
          <div className="settings-theme-options">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`settings-theme-option ${theme === opt.value ? "active" : ""}`}
                onClick={() => setTheme(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="settings-field-hint">
            Choose your preferred appearance
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">
          Model
          {modelSaved && (
            <span className="settings-saved" style={{ marginLeft: 8 }}>
              Saved
            </span>
          )}
        </div>

        <div className="settings-field">
          <label className="settings-field-label">Provider</label>
          <select
            className="input settings-select"
            value={modelProvider}
            onChange={(e) => {
              const v = e.target.value;
              setModelProvider(v);
              if (v === "custom" && !modelBaseUrl) {
                setModelBaseUrl("http://localhost:1234/v1");
              }
            }}
          >
            {PROVIDERS.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="settings-field-hint">
            {isCustomProvider
              ? "Use any OpenAI-compatible endpoint (LM Studio, Ollama, vLLM, etc.)"
              : "Select your inference provider, or auto-detect from API keys"}
          </div>
        </div>

        <div className="settings-field">
          <label className="settings-field-label">Model</label>
          <input
            className="input"
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g. anthropic/claude-opus-4.6"
          />
          <div className="settings-field-hint">
            Default model name (leave blank for provider default)
          </div>
        </div>

        {isCustomProvider && (
          <div className="settings-field">
            <label className="settings-field-label">Base URL</label>
            <input
              className="input"
              type="text"
              value={modelBaseUrl}
              onChange={(e) => setModelBaseUrl(e.target.value)}
              placeholder="http://localhost:1234/v1"
            />
            <div className="settings-field-hint">
              OpenAI-compatible API endpoint
            </div>
          </div>
        )}
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Credential Pool</div>
        <div className="settings-field">
          <div className="settings-field-hint" style={{ marginBottom: 10 }}>
            Add multiple API keys per provider for automatic rotation and load
            balancing. Hermes will cycle through them.
          </div>
          <div className="settings-pool-add">
            <select
              className="input"
              value={poolProvider}
              onChange={(e) => setPoolProvider(e.target.value)}
              style={{ width: 140 }}
            >
              <option value="">Provider</option>
              {PROVIDERS.options
                .filter((p) => p.value !== "auto")
                .map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
            </select>
            <input
              className="input"
              type="password"
              value={poolNewKey}
              onChange={(e) => setPoolNewKey(e.target.value)}
              placeholder="API key"
              style={{ flex: 1 }}
            />
            <input
              className="input"
              type="text"
              value={poolNewLabel}
              onChange={(e) => setPoolNewLabel(e.target.value)}
              placeholder="Label (optional)"
              style={{ width: 120 }}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleAddPoolKey}
              disabled={!poolProvider || !poolNewKey.trim()}
            >
              Add
            </button>
          </div>
          {Object.entries(credPool).map(
            ([provider, entries]) =>
              entries.length > 0 && (
                <div key={provider} className="settings-pool-group">
                  <div className="settings-pool-provider">
                    {PROVIDERS.options.find((p) => p.value === provider)
                      ?.label || provider}
                  </div>
                  {entries.map((entry, idx) => (
                    <div key={idx} className="settings-pool-entry">
                      <span className="settings-pool-label">
                        {entry.label || `Key ${idx + 1}`}
                      </span>
                      <span className="settings-pool-key">
                        {entry.key
                          ? `${entry.key.slice(0, 8)}...${entry.key.slice(-4)}`
                          : "(empty)"}
                      </span>
                      <button
                        className="btn-ghost"
                        style={{ color: "var(--error)", fontSize: 11 }}
                        onClick={() => handleRemovePoolKey(provider, idx)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ),
          )}
        </div>
      </div>

      {SETTINGS_SECTIONS.map((section) => (
        <div key={section.title} className="settings-section">
          <div className="settings-section-title">{section.title}</div>
          {section.items.map((field) => (
            <div key={field.key} className="settings-field">
              <label className="settings-field-label">
                {field.label}
                {savedKey === field.key && (
                  <span className="settings-saved">Saved</span>
                )}
              </label>
              <div className="settings-input-row">
                <input
                  className="input"
                  type={
                    field.type === "password" && !visibleKeys.has(field.key)
                      ? "password"
                      : "text"
                  }
                  value={env[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onBlur={() => handleBlur(field.key)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
                {field.type === "password" && (
                  <button
                    className="btn-ghost settings-toggle-btn"
                    onClick={() => toggleVisibility(field.key)}
                  >
                    {visibleKeys.has(field.key) ? "Hide" : "Show"}
                  </button>
                )}
              </div>
              <div className="settings-field-hint">{field.hint}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Settings;
