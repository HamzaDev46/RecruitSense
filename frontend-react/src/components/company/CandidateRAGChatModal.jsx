import React, { useState, useEffect, useRef } from 'react'
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileText,
  HelpCircle,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Send,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

const QUICK_SUGGESTIONS = [
  {
    icon: '📋',
    label: 'Overview & Summary',
    prompt: 'Can you provide a concise executive summary of this candidate, including total experience, key domains, and primary strengths?',
  },
  {
    icon: '🛠️',
    label: 'Projects & Tech Stack',
    prompt: 'What major projects has this candidate built, and what specific technologies or tools did they use in those projects?',
  },
  {
    icon: '🎓',
    label: 'Education & Certifications',
    prompt: 'What is their educational background, degrees, universities, and any professional certifications listed?',
  },
  {
    icon: '⚠️',
    label: 'Skill Gaps & Risks',
    prompt: 'Based strictly on their resume, what essential skills or domain experience might be lacking for a senior development role?',
  },
  {
    icon: '💼',
    label: 'Tailored Interview Questions',
    prompt: 'Generate 3 challenging technical interview questions tailored specifically to the projects and technologies listed in this resume.',
  },
]

export default function CandidateRAGChatModal({ isOpen, onClose, application }) {
  const [messages, setMessages] = useState([])
  const [inputQuery, setInputQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const candidateName = application?.job_seeker?.user?.name || 'Candidate'
  const jobTitle = application?.job_posting?.title || 'Applied Position'
  const matchScore = application?.final_score ?? application?.similarity_score ?? 0

  // Initialize initial greeting when modal opens or application changes
  useEffect(() => {
    if (isOpen && application) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `Hello! I have indexed **${candidateName}**'s resume into the ChromaDB vector engine. \n\nYou can ask me specific questions regarding their career history, technical proficiencies, project contributions, or request customized interview questions.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
      setInputQuery('')
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, application?.id])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (!isOpen || !application) return null

  const handleSend = async (queryToSend) => {
    const text = (queryToSend || inputQuery).trim()
    if (!text || loading) return

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputQuery('')
    setLoading(true)

    try {
      const response = await api.post(`/applications/${application.id}/ask-ai`, {
        question: text,
      })

      const data = response.data
      const answerText = data.answer || data.message || 'No response generated from the AI assistant.'
      const sources = Array.isArray(data.sources) ? data.sources : []

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: answerText,
        sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Could not connect to RecruitSense AI RAG service. Please ensure Ollama and AI microservice are running.'

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          isError: true,
          text: `⚠️ **Error querying candidate resume:**\n\n${errorMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: 'ai',
        text: `Chat reset. I am ready to answer more questions regarding **${candidateName}**'s resume.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  // Basic formatting helper for bold and bullets
  const renderFormattedText = (rawText) => {
    if (!rawText) return null
    const lines = rawText.split('\n')

    return lines.map((line, idx) => {
      // Bullet point
      const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('• ')
      const cleanLine = isBullet ? line.trim().replace(/^[-*•]\s+/, '') : line

      // Replace bold **text**
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
        }
        return part
      })

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-purple-600 font-bold mt-0.5">•</span>
            <span className="text-gray-800 leading-relaxed">{parts}</span>
          </div>
        )
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-2" />
      }

      return (
        <p key={idx} className="my-1 leading-relaxed text-gray-800">
          {parts}
        </p>
      )
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[750px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-100 animate-scaleUp">
        
        {/* ================= HEADER ================= */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 text-white px-5 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-purple-200 border border-white/20 shadow-inner flex-shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white truncate">
                  Talk to Resume: <span className="text-purple-200">{candidateName}</span>
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/15 text-purple-100 px-2.5 py-0.5 rounded-full border border-white/20">
                  <Bot className="w-3 h-3 text-amber-300" /> LLaMA 3.2 RAG
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  Match: {matchScore}%
                </span>
              </div>
              <p className="text-xs text-purple-200/80 truncate mt-0.5">
                Applied for: <span className="text-white font-medium">{jobTitle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleResetChat}
              title="Reset Conversation"
              className="p-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= SUB-BANNER ================= */}
        <div className="bg-purple-50/70 border-b border-purple-100/80 px-5 py-2 flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            <span>
              All answers are grounded in <strong>{candidateName}</strong>'s uploaded PDF resume using Dense Vector Retrieval.
            </span>
          </div>
          <span className="text-[11px] text-purple-600 font-medium hidden sm:inline">
            FastAPI AI Microservice • ChromaDB
          </span>
        </div>

        {/* ================= CHAT BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                    : msg.isError
                    ? 'bg-red-100 text-red-600 border border-red-200'
                    : 'bg-white text-purple-700 border border-purple-200'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-purple-600" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-1.5">
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-sm shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                      : msg.isError
                      ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-none'
                      : 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-none'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="text-gray-800 text-sm leading-relaxed">
                      {renderFormattedText(msg.text)}
                    </div>
                  )}

                  {/* Sources Preview if available */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-gray-100 text-xs text-gray-500">
                      <p className="font-semibold text-purple-700 mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Context retrieved from resume sections:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md border border-purple-100 text-[10px] font-medium"
                          >
                            {src.section || `Chunk ${sIdx + 1}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`flex items-center gap-2 px-1 text-[10px] text-gray-400 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'ai' && !msg.isError && (
                    <button
                      onClick={() => handleCopy(msg.text)}
                      className="hover:text-purple-600 transition flex items-center gap-0.5"
                      title="Copy response"
                    >
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-[85%] mr-auto items-start animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-white text-purple-700 border border-purple-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-purple-600 animate-spin" />
              </div>
              <div className="bg-white border border-purple-100 rounded-2xl rounded-tl-none p-3.5 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>LLaMA 3.2 analyzing resume embeddings...</span>
                </div>
                <div className="flex gap-1.5 py-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ================= QUICK PROMPT SUGGESTIONS ================= */}
        <div className="bg-white border-t border-gray-100 px-4 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-500" /> Suggested Recruiter Queries:
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100/80 text-purple-800 text-xs font-medium rounded-xl border border-purple-200/70 whitespace-nowrap transition disabled:opacity-50 shadow-xs"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                <ChevronRight className="w-3 h-3 text-purple-400" />
              </button>
            ))}
          </div>
        </div>

        {/* ================= INPUT FOOTER ================= */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-200 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={`Ask anything about ${candidateName}'s resume (e.g., projects, experience, stack)...`}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || loading}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-md hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </div>
    </div>
  )
}
