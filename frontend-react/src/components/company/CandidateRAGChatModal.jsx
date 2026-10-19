import React, { useState, useEffect, useRef } from 'react'
import {
  AlertCircle,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileCheck,
  FileText,
  GraduationCap,
  HelpCircle,
  Loader2,
  RotateCcw,
  Send,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

const QUICK_SUGGESTIONS = [
  {
    icon: FileText,
    label: 'Executive Summary',
    prompt: 'Provide a concise professional executive summary of this candidate, covering total career experience, primary domain expertise, and core strengths.',
  },
  {
    icon: Briefcase,
    label: 'Projects & Tech Stack',
    prompt: 'What key projects and technical initiatives has this candidate contributed to, and what specific tools, technologies, and methodologies were utilized?',
  },
  {
    icon: GraduationCap,
    label: 'Education & Certifications',
    prompt: 'Detail the candidate’s academic background, university degrees, and any verified professional licenses or industry certifications.',
  },
  {
    icon: AlertCircle,
    label: 'Skill Gaps & Risk Analysis',
    prompt: 'Based strictly on their verified resume content, what core competencies or domain depth might be missing or unverified for this role?',
  },
  {
    icon: HelpCircle,
    label: 'Targeted Interview Questions',
    prompt: 'Generate 3 high-impact, competency-based interview questions tailored specifically to the project experiences and milestones detailed in this resume.',
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

  // Normalize match percentage display (e.g. 0.83 -> 83%, 83 -> 83%)
  const rawScore = Number(application?.final_score ?? application?.similarity_score ?? 0)
  const displayScore = rawScore <= 1 && rawScore > 0 ? Math.round(rawScore * 100) : Math.round(rawScore)

  // Initialize professional dossier welcome
  useEffect(() => {
    if (isOpen && application) {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Candidate dossier initialized for **${candidateName}**.\n\nAll queries are cross-referenced directly against verified credentials extracted from the candidate's uploaded resume.\n\nYou can inquire about career chronology, evaluate technical and leadership proficiencies, inspect project milestones, or generate role-specific interview discussion points.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
      setInputQuery('')
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, application?.id])

  // Auto-scroll to bottom of conversation
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
      const answerText = data.answer || data.message || 'No documented details found in the verified resume context.'
      const sources = Array.isArray(data.sources) ? data.sources : []

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: answerText,
        sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Unable to query candidate resume records at this time. Please ensure the AI verification service is reachable.'

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          isError: true,
          text: `**Inquiry Exception:**\n\n${errorMsg}`,
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
    // Strip markdown formatting before copying
    const plainText = text.replace(/\*\*/g, '').replace(/^[•\-\*]\s+/gm, '• ')
    navigator.clipboard.writeText(plainText)
    toast.success('Copied to clipboard')
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: 'assistant',
        text: `Dossier inquiry refreshed for **${candidateName}**. Select a quick inquiry topic or type a specific question below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  // Sanitize text from broken PDF font glyphs (box characters, private use unicode)
  const sanitizeText = (str) => {
    if (!str) return ''
    return str
      .replace(/[\uE000-\uF8FF\uF000-\uFFFF\u25A0-\u25FF\uFFFD\uF15B\uF14A\u25AA\u25AB]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  // Professional typography renderer
  const renderFormattedContent = (rawText) => {
    if (!rawText) return null
    const lines = rawText.split('\n')

    return lines.map((line, idx) => {
      const cleanLine = sanitizeText(line)
      if (!cleanLine) {
        return <div key={idx} className="h-1.5" />
      }

      const isBullet = cleanLine.startsWith('* ') || cleanLine.startsWith('- ') || cleanLine.startsWith('• ')
      const textToRender = isBullet ? cleanLine.replace(/^[-*•]\s+/, '').trim() : cleanLine

      // Parse bold segments
      const parts = textToRender.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span key={pIdx} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </span>
          )
        }
        return part
      })

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2.5 my-1.5 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
            <div className="text-slate-700 leading-relaxed text-sm">{parts}</div>
          </div>
        )
      }

      // Check if line looks like a section header (ends with colon)
      const isHeader = cleanLine.endsWith(':') && cleanLine.length < 90

      return (
        <p
          key={idx}
          className={`leading-relaxed ${
            isHeader
              ? 'font-semibold text-slate-900 mt-3 mb-1 text-sm'
              : 'text-slate-700 text-sm my-1'
          }`}
        >
          {parts}
        </p>
      )
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[760px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-scaleUp">
        
        {/* ================= EXECUTIVE HEADER ================= */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-indigo-400 shrink-0 shadow-xs">
              <FileCheck className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Candidate Dossier: <span className="text-slate-100 font-bold">{candidateName}</span>
                </h3>

                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ATS Alignment: {displayScore}%
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Verified Credentials
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Role Applied: <span className="text-slate-200 font-medium">{jobTitle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-3">
            <button
              onClick={handleResetChat}
              title="Reset Conversation"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close Dialog"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= COMPLIANCE & AUDIT SUB-BANNER ================= */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-6 py-2 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 min-w-0">
            <BadgeCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">
              Document Audit: Answers are synthesized strictly from <strong>{candidateName}</strong>'s uploaded PDF resume.
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 shrink-0 ml-2 hidden sm:inline">
            Status: Grounded • Anti-Hallucination Active
          </span>
        </div>

        {/* ================= CHAT CONVERSATION BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar Indicator */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : msg.isError
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4 text-indigo-600" />
                )}
              </div>

              {/* Message Content Container */}
              <div className="space-y-1.5 min-w-0">
                <div
                  className={`p-4 rounded-xl text-sm leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : msg.isError
                      ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-xs'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div>{renderFormattedContent(msg.text)}</div>
                  )}

                  {/* Document Sources Cross-Reference */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium mb-1.5 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Referenced Resume Sections:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 text-[10px] font-medium"
                          >
                            {src.section || `Document Section ${sIdx + 1}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Timestamp & Copy Action */}
                <div
                  className={`flex items-center gap-2 px-1 text-[11px] text-slate-400 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'assistant' && !msg.isError && (
                    <button
                      onClick={() => handleCopy(msg.text)}
                      className="hover:text-slate-700 transition-colors flex items-center gap-1"
                      title="Copy response to clipboard"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Clean Executive Loading State */}
          {loading && (
            <div className="flex gap-3 max-w-[85%] mr-auto items-start animate-fadeIn">
              <div className="w-8 h-8 rounded-lg bg-white text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="bg-white border border-slate-200 rounded-xl rounded-tl-xs p-4 shadow-xs space-y-2">
                <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span>Evaluating candidate resume credentials...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ================= EXECUTIVE QUICK PROMPT CHIPS ================= */}
        <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            Suggested Inquiries:
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_SUGGESTIONS.map((item, idx) => {
              const IconComponent = item.icon
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-medium rounded-lg border border-slate-200 whitespace-nowrap transition-colors disabled:opacity-50 shadow-2xs shrink-0"
                >
                  <IconComponent className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.label}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400 ml-0.5" />
                </button>
              )
            })}
          </div>
        </div>

        {/* ================= PROFESSIONAL INQUIRY INPUT ================= */}
        <div className="p-3.5 sm:p-5 bg-white border-t border-slate-200 flex items-center gap-2.5">
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={`Inquire about ${candidateName}'s verified skills, experience, or role compatibility...`}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || loading}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Inquire</span>
          </button>
        </div>

      </div>
    </div>
  )
}
