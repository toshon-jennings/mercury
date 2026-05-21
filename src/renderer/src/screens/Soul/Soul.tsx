import { useState, useEffect, useRef, useCallback } from "react";
import { useIntlayer } from "react-intlayer";
import { Refresh } from "../../assets/icons";

interface SoulProps {
  profile?: string;
}

function Soul({ profile }: SoulProps): React.JSX.Element {
  const content = useIntlayer("soul");
  const [soulText, setSoulText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const loaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSoul = useCallback(async (): Promise<void> => {
    loaded.current = false;
    setLoading(true);
    const text = await window.hermesAPI.readSoul(profile);
    setSoulText(text);
    setLoading(false);
    setTimeout(() => {
      loaded.current = true;
    }, 300);
  }, [profile]);

  useEffect(() => {
    loadSoul();
  }, [loadSoul]);

  const saveSoul = useCallback(
    async (text: string) => {
      if (!loaded.current) return;
      await window.hermesAPI.writeSoul(text, profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [profile],
  );

  useEffect(() => {
    if (!loaded.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveSoul(soulText);
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [soulText, saveSoul]);

  async function handleReset(): Promise<void> {
    const newContent = await window.hermesAPI.resetSoul(profile);
    loaded.current = false;
    setSoulText(newContent);
    setShowReset(false);
    setSaved(true);
    setTimeout(() => {
      loaded.current = true;
      setSaved(false);
    }, 2000);
  }

  if (loading) {
    return (
      <div className="soul-container">
        <div className="soul-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="screen-layout soul-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            {content.title}
            {saved && <span className="soul-saved">{content.saved}</span>}
          </h2>
          <p className="page-subtitle">{content.subtitle}</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowReset(true)}
          title={content.resetTitle}
        >
          <Refresh size={14} />
          {content.reset}
        </button>
      </div>

      {showReset && (
        <div className="soul-reset-confirm">
          <span>{content.resetConfirm}</span>
          <div className="soul-reset-actions">
            <button className="btn btn-primary btn-sm" onClick={handleReset}>
              {content.reset}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowReset(false)}
            >
              {content.cancel}
            </button>
          </div>
        </div>
      )}

      <textarea
        className="soul-editor"
        value={soulText}
        onChange={(e) => setSoulText(e.target.value)}
        placeholder={content.placeholder}
        spellCheck={false}
      />

      <div className="soul-hint">{content.hint}</div>
    </div>
  );
}

export default Soul;
