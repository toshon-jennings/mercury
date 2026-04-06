import { useState, useCallback, useEffect } from "react";
import Chat, { ChatMessage } from "./Chat";
import Sessions from "./Sessions";
import Agents from "./Agents";
import Settings from "./Settings";
import Skills from "./Skills";
import Soul from "./Soul";
import Memory from "./Memory";
import Tools from "./Tools";
import Gateway from "./Gateway";
import Office from "./Office";
import Models from "./Models";
import hermeslogo from "../assets/hermes.png";
import {
  ChatBubble,
  Clock,
  Users,
  Settings as SettingsIcon,
  Puzzle,
  Sparkles,
  Brain,
  Wrench,
  Signal,
  Building,
  Layers,
  Download,
} from "../assets/icons";
import type { LucideIcon } from "lucide-react";

type View =
  | "chat"
  | "sessions"
  | "agents"
  | "office"
  | "models"
  | "skills"
  | "soul"
  | "memory"
  | "tools"
  | "gateway"
  | "settings";

const NAV_ITEMS: { view: View; icon: LucideIcon; label: string }[] = [
  { view: "chat", icon: ChatBubble, label: "Chat" },
  { view: "sessions", icon: Clock, label: "Sessions" },
  { view: "agents", icon: Users, label: "Profiles" },
  { view: "office", icon: Building, label: "Office" },
  { view: "models", icon: Layers, label: "Models" },
  { view: "skills", icon: Puzzle, label: "Skills" },
  { view: "soul", icon: Sparkles, label: "Persona" },
  { view: "memory", icon: Brain, label: "Memory" },
  { view: "tools", icon: Wrench, label: "Tools" },
  { view: "gateway", icon: Signal, label: "Gateway" },
  { view: "settings", icon: SettingsIcon, label: "Settings" },
];

function Layout(): React.JSX.Element {
  const [view, setView] = useState<View>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState("default");

  // Auto-update state
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateState, setUpdateState] = useState<
    "available" | "downloading" | "ready" | null
  >(null);
  const [downloadPercent, setDownloadPercent] = useState(0);

  useEffect(() => {
    const cleanupAvailable = window.hermesAPI.onUpdateAvailable((info) => {
      setUpdateVersion(info.version);
      setUpdateState("available");
    });
    const cleanupProgress = window.hermesAPI.onUpdateDownloadProgress(
      (info) => {
        setDownloadPercent(info.percent);
      },
    );
    const cleanupDownloaded = window.hermesAPI.onUpdateDownloaded(() => {
      setUpdateState("ready");
    });
    return () => {
      cleanupAvailable();
      cleanupProgress();
      cleanupDownloaded();
    };
  }, []);

  async function handleUpdate(): Promise<void> {
    if (updateState === "available") {
      setUpdateState("downloading");
      await window.hermesAPI.downloadUpdate();
    } else if (updateState === "ready") {
      await window.hermesAPI.installUpdate();
    }
  }

  const handleNewChat = useCallback(() => {
    // Abort any in-flight chat before clearing
    window.hermesAPI.abortChat();
    setMessages([]);
    setCurrentSessionId(null);
    setView("chat");
  }, []);

  // Listen for menu IPC events (Cmd+N, Cmd+K from app menu)
  useEffect(() => {
    const cleanupNewChat = window.hermesAPI.onMenuNewChat(() => {
      handleNewChat();
    });
    const cleanupSearch = window.hermesAPI.onMenuSearchSessions(() => {
      setView("sessions");
    });
    return () => {
      cleanupNewChat();
      cleanupSearch();
    };
  }, [handleNewChat]);

  const handleSelectProfile = useCallback((name: string) => {
    setActiveProfile(name);
    setMessages([]);
    setCurrentSessionId(null);
  }, []);

  const handleResumeSession = useCallback(async (sessionId: string) => {
    const dbMessages = await window.hermesAPI.getSessionMessages(sessionId);
    const chatMessages: ChatMessage[] = dbMessages.map((m) => ({
      id: `db-${m.id}`,
      role: m.role === "user" ? "user" : "agent",
      content: m.content,
    }));
    setMessages(chatMessages);
    setCurrentSessionId(sessionId);
    setView("chat");
  }, []);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={hermeslogo} height={30} alt="" />
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ view: v, icon: Icon, label }) => (
            <button
              key={v}
              className={`sidebar-nav-item ${view === v ? "active" : ""}`}
              onClick={() => setView(v)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {updateState && (
            <button className="sidebar-update-btn" onClick={handleUpdate}>
              <Download size={13} />
              {updateState === "available" && (
                <span>Update v{updateVersion}</span>
              )}
              {updateState === "downloading" && (
                <span>Downloading {downloadPercent}%</span>
              )}
              {updateState === "ready" && <span>Restart to update</span>}
            </button>
          )}
          <div className="sidebar-footer-text">
            {activeProfile === "default" ? "Hermes Agent" : activeProfile}
          </div>
        </div>
      </aside>

      <main className="content">
        <div
          style={{
            display: view === "chat" ? "flex" : "none",
            flex: 1,
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Chat
            messages={messages}
            setMessages={setMessages}
            sessionId={currentSessionId}
            profile={activeProfile}
            onNewChat={handleNewChat}
          />
        </div>
        {view === "sessions" && (
          <Sessions
            onResumeSession={handleResumeSession}
            onNewChat={handleNewChat}
            currentSessionId={currentSessionId}
          />
        )}
        {view === "agents" && (
          <Agents
            activeProfile={activeProfile}
            onSelectProfile={handleSelectProfile}
            onChatWith={(name: string) => {
              handleSelectProfile(name);
              setView("chat");
            }}
          />
        )}
        <div
          style={{
            display: view === "office" ? "flex" : "none",
            flex: 1,
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Office />
        </div>
        {view === "models" && <Models />}
        {view === "skills" && <Skills profile={activeProfile} />}
        {view === "soul" && <Soul profile={activeProfile} />}
        {view === "memory" && <Memory profile={activeProfile} />}
        {view === "tools" && <Tools profile={activeProfile} />}
        {view === "gateway" && <Gateway profile={activeProfile} />}
        {view === "settings" && <Settings profile={activeProfile} />}
      </main>
    </div>
  );
}

export default Layout;
