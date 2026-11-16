'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Minimize2,
  Maximize2,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

const QUICK_PROMPTS = [
  { label: '📋 How to report', query: 'How do I report a maintenance issue?' },
  { label: '🏷️ Suggest category', query: 'Suggest the right category for my issue' },
  { label: '🔄 What does status mean?', query: 'What does In Progress status mean?' },
  { label: '✍️ Help write description', query: 'Help me draft a clear issue description' },
  { label: '🚰 Water leakage', query: 'There is a water pipe leakage in the bathroom' },
];

export function CampusFixAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I'm **CampusFix AI**, your intelligent campus facilities assistant. 🤖\n\nNeed help reporting a broken facility, choosing the right category, or tracking an existing maintenance request? Ask me anything or choose a quick prompt below!`,
      time: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));
      history.push({ role: 'user', content: query });

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error('AI service error');

      const data = await res.json();
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || 'I could not generate a response. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error('CampusFix AI Chat error:', err);
      const errorReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Sorry, I encountered an issue connecting to the maintenance knowledge engine. Please check your network and try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Hello! I'm **CampusFix AI**, your intelligent campus facilities assistant. 🤖\n\nNeed help reporting a broken facility, choosing the right category, or tracking an existing maintenance request? Ask me anything!`,
        time: 'Just now',
      },
    ]);
  };

  // Helper to render markdown-like formatting simply
  const renderMessageText = (text: string) => {
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {text.split('\n').map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;
          
          // Headings
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 mt-2 text-sm sm:text-base border-b border-slate-200/60 pb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          
          // Bullet points
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-teal-600 font-bold leading-tight mt-0.5">•</span>
                <span>{formatBoldText(line.substring(2))}</span>
              </div>
            );
          }
          
          // Numbered lists
          const numMatch = line.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="font-semibold text-teal-700 min-w-[1.2rem]">{numMatch[1]}.</span>
                <span>{formatBoldText(numMatch[2])}</span>
              </div>
            );
          }

          // Blockquote
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="border-l-2 border-teal-500 pl-2.5 py-0.5 my-1 bg-teal-50/50 rounded-r text-slate-700 italic">
                {formatBoldText(line.substring(2))}
              </blockquote>
            );
          }

          return <p key={idx}>{formatBoldText(line)}</p>;
        })}
      </div>
    );
  };

  const formatBoldText = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans print:hidden">
      {/* Floating Robot Trigger Button */}
      {!isOpen && (
        <div className="relative group">
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open CampusFix AI Assistant"
            className="flex items-center gap-3 bg-gradient-to-r from-[#102A43] to-[#0D9488] text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl hover:shadow-teal-500/30 hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/40 cursor-pointer"
          >
            {/* 3D-Styled Robot Icon */}
            <div className="relative flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center shadow-inner border border-white/30 animate-pulse">
                <Bot className="w-5 h-5 text-teal-300 drop-shadow" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-[#102A43] rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-[#102A43] rounded-full" />
            </div>

            <div className="hidden sm:block text-left pr-1">
              <div className="text-[11px] font-medium tracking-wide uppercase text-teal-300 leading-none">
                AI Facilities
              </div>
              <div className="text-sm font-bold text-white leading-tight flex items-center gap-1">
                CampusFix AI <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
            </div>
          </button>

          {/* Hover Tooltip on desktop */}
          <div className="hidden group-hover:block absolute bottom-full right-0 mb-3 w-56 p-2.5 bg-slate-900 text-white text-xs rounded-xl shadow-xl pointer-events-none transition-opacity">
            <p className="font-semibold text-teal-300 flex items-center gap-1 mb-0.5">
              <Bot className="w-3.5 h-3.5" /> Need facility help?
            </p>
            <p className="text-slate-300 text-[11px]">
              Chat with CampusFix AI to draft reports, select categories & track repairs!
            </p>
          </div>
        </div>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div
          className={`bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col transition-all duration-300 overflow-hidden ${
            isMinimized
              ? 'w-80 sm:w-96 h-16'
              : 'w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#102A43] via-[#163654] to-[#0D9488] p-3.5 sm:px-4 text-white flex items-center justify-between shadow-sm select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40">
                  <Bot className="w-5 h-5 text-teal-200" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#102A43] rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm sm:text-base leading-tight">CampusFix AI</h3>
                  <span className="text-[10px] bg-teal-500/30 text-teal-200 font-semibold px-1.5 py-0.5 rounded border border-teal-400/30">
                    Smart Bot
                  </span>
                </div>
                <p className="text-[11px] text-teal-100/80 leading-none mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Campus Maintenance Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!isMinimized && (
                <button
                  onClick={handleClear}
                  title="Reset conversation"
                  aria-label="Reset conversation"
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                aria-label="Close chat"
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Body (hidden when minimized) */}
          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-[#102A43] text-white rounded-br-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      {msg.sender === 'ai' ? (
                        renderMessageText(msg.text)
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {msg.time}
                    </span>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm w-fit">
                    <Bot className="w-4 h-4 text-teal-600 animate-spin" />
                    <span className="text-xs font-medium text-slate-600">
                      Analyzing campus knowledge...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-3 py-2 bg-slate-100 border-t border-slate-200/80 overflow-x-auto whitespace-nowrap flex items-center gap-1.5 scrollbar-thin">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 pl-1">
                  <Lightbulb className="w-3 h-3 text-amber-500" /> Prompts:
                </span>
                {QUICK_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.query)}
                    disabled={loading}
                    className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-white border border-slate-300 text-slate-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 transition-colors shadow-2xs font-medium cursor-pointer disabled:opacity-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question or describe an issue..."
                  disabled={loading}
                  className="flex-1 text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="Send message to AI"
                  className="bg-[#0D9488] hover:bg-teal-700 disabled:bg-slate-300 text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:cursor-not-allowed active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
