import { useState, useEffect, useRef, useCallback } from 'react'
import Markdown from 'react-markdown'
import icon from '../assets/icon.png'
import { Trash, Send, Stop, Plus, ChevronDown } from '../assets/icons'

function HermesAvatar({ size = 30 }: { size?: number }): React.JSX.Element {
  return (
    <div className="chat-avatar chat-avatar-agent">
      <img src={icon} width={size} height={size} alt="" />
    </div>
  )
}

// Shared Markdown renderer that opens links externally
function AgentMarkdown({ children }: { children: string }): React.JSX.Element {
  return (
    <Markdown
      components={{
        a: ({ href, children }) => (
          <a
            href={href}
            onClick={(e) => {
              e.preventDefault()
              if (href) window.hermesAPI.openExternal(href)
            }}
          >
            {children}
          </a>
        )
      }}
    >
      {children}
    </Markdown>
  )
}

export { AgentMarkdown }

export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
}

interface ModelGroup {
  provider: string
  providerLabel: string
  models: { provider: string; model: string; label: string }[]
}

const PROVIDER_LABELS: Record<string, string> = {
  openrouter: 'OpenRouter',
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  groq: 'Groq',
  custom: 'Custom'
}

interface ChatProps {
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  sessionId: string | null
  profile?: string
  onSessionStarted?: () => void
  onNewChat?: () => void
}

function Chat({
  messages,
  setMessages,
  sessionId,
  profile,
  onSessionStarted,
  onNewChat
}: ChatProps): React.JSX.Element {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isLoadingRef = useRef(false)

  // Model picker state
  const [currentModel, setCurrentModel] = useState('')
  const [currentProvider, setCurrentProvider] = useState('auto')
  const [currentBaseUrl, setCurrentBaseUrl] = useState('')
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([])
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [customModelInput, setCustomModelInput] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)

  // Keep ref in sync for use in IPC callbacks
  isLoadingRef.current = isLoading

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Load model config and build available models list
  useEffect(() => {
    loadModelConfig()
  }, [profile])

  async function loadModelConfig(): Promise<void> {
    const [mc, savedModels] = await Promise.all([
      window.hermesAPI.getModelConfig(profile),
      window.hermesAPI.listModels()
    ])
    setCurrentModel(mc.model)
    setCurrentProvider(mc.provider)
    setCurrentBaseUrl(mc.baseUrl)

    // Group saved models by provider
    const groupMap = new Map<string, ModelGroup>()
    for (const m of savedModels) {
      if (!groupMap.has(m.provider)) {
        groupMap.set(m.provider, {
          provider: m.provider,
          providerLabel: PROVIDER_LABELS[m.provider] || m.provider,
          models: []
        })
      }
      groupMap.get(m.provider)!.models.push({
        provider: m.provider,
        model: m.model,
        label: m.name
      })
    }
    setModelGroups(Array.from(groupMap.values()))
  }

  // Close picker on click outside
  useEffect(() => {
    if (!showModelPicker) return
    function handleClickOutside(e: MouseEvent): void {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showModelPicker])

  async function selectModel(provider: string, model: string): Promise<void> {
    const baseUrl = provider === 'custom' ? currentBaseUrl : ''
    await window.hermesAPI.setModelConfig(provider, model, baseUrl, profile)
    setCurrentModel(model)
    setCurrentProvider(provider)
    setShowModelPicker(false)
    setCustomModelInput('')
  }

  async function handleCustomModelSubmit(): Promise<void> {
    const model = customModelInput.trim()
    if (!model) return
    await selectModel(currentProvider === 'auto' ? 'auto' : currentProvider, model)
  }

  // IPC listeners — stable callback refs, registered once
  useEffect(() => {
    const cleanupChunk = window.hermesAPI.onChatChunk((chunk) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last && last.role === 'agent') {
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }]
        }
        return [...prev, { id: `agent-${Date.now()}`, role: 'agent', content: chunk }]
      })
    })

    const cleanupDone = window.hermesAPI.onChatDone(() => {
      setIsLoading(false)
    })

    const cleanupError = window.hermesAPI.onChatError((error) => {
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: 'agent', content: `Error: ${error}` }
      ])
      setIsLoading(false)
    })

    return () => {
      cleanupChunk()
      cleanupDone()
      cleanupError()
    }
  }, [setMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus()
    }
  }, [isLoading])

  // Keyboard shortcut: Cmd+N for new chat
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        if (onNewChat) onNewChat()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNewChat])

  async function handleSend(): Promise<void> {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')

    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    setIsLoading(true)
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: text }])
    onSessionStarted?.()

    try {
      await window.hermesAPI.sendMessage(text, profile)
    } catch {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    setInput(e.target.value)
    const target = e.target
    target.style.height = 'auto'
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`
  }

  function handleAbort(): void {
    window.hermesAPI.abortChat()
    setIsLoading(false)
    // Refocus input after aborting
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleClear(): void {
    // Abort any in-flight request before clearing
    if (isLoading) {
      window.hermesAPI.abortChat()
      setIsLoading(false)
    }
    setMessages([])
  }

  const displayModel = currentModel
    ? currentModel.split('/').pop() || currentModel
    : currentProvider === 'auto'
      ? 'Auto'
      : 'No model set'

  const lastMessageIsAgent = messages.length > 0 && messages[messages.length - 1].role === 'agent'

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-title">
          {sessionId ? `Session ${sessionId.slice(-6)}` : 'New Chat'}
        </div>
        <div className="chat-header-actions">
          {onNewChat && (
            <button
              className="btn-ghost chat-clear-btn"
              onClick={onNewChat}
              title="New chat (Cmd+N)"
            >
              <Plus size={16} />
            </button>
          )}
          {messages.length > 0 && (
            <button
              className="btn-ghost chat-clear-btn"
              onClick={handleClear}
              title="Clear chat"
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <HermesAvatar size={48} />
            <div className="chat-empty-text">How can I help you today?</div>
            <div className="chat-empty-hint">
              Ask me to write code, answer questions, search the web, and more
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`chat-message chat-message-${msg.role}`}>
              {msg.role === 'user' ? (
                <div className="chat-avatar chat-avatar-user">U</div>
              ) : (
                <HermesAvatar />
              )}

              <div className={`chat-bubble chat-bubble-${msg.role}`}>
                {msg.role === 'agent' ? (
                  <AgentMarkdown>{msg.content}</AgentMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && !lastMessageIsAgent && (
          <div className="chat-message chat-message-agent">
            <HermesAvatar />
            <div className="chat-bubble chat-bubble-agent">
              <div className="chat-typing">
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Type a message... (Shift+Enter for new line)"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
            autoFocus
          />
          {isLoading ? (
            <button className="chat-send-btn chat-stop-btn" onClick={handleAbort} title="Stop">
              <Stop size={14} />
            </button>
          ) : (
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim()}
              title="Send"
            >
              <Send size={16} />
            </button>
          )}
        </div>

        <div className="chat-model-bar" ref={pickerRef}>
          <button
            className="chat-model-trigger"
            onClick={() => setShowModelPicker(!showModelPicker)}
          >
            <span className="chat-model-name">{displayModel}</span>
            <ChevronDown size={12} />
          </button>

          {showModelPicker && (
            <div className="chat-model-dropdown">
              {modelGroups.map((group) => (
                <div key={group.provider} className="chat-model-group">
                  <div className="chat-model-group-label">{group.providerLabel}</div>
                  {group.models.map((m) => (
                    <button
                      key={m.model}
                      className={`chat-model-option ${currentModel === m.model ? 'active' : ''}`}
                      onClick={() => selectModel(m.provider, m.model)}
                    >
                      <span className="chat-model-option-label">{m.label}</span>
                      <span className="chat-model-option-id">{m.model}</span>
                    </button>
                  ))}
                </div>
              ))}

              <div className="chat-model-group">
                <div className="chat-model-group-label">Custom</div>
                <div className="chat-model-custom">
                  <input
                    className="chat-model-custom-input"
                    type="text"
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCustomModelSubmit()
                    }}
                    placeholder="Type model name..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Chat
