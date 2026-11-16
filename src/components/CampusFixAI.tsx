'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Minimize2,
  Maximize2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Globe,
  Cpu,
  RotateCcw,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  provider?: string;
  model?: string;
  audioUrl?: string;
}

const QUICK_PROMPTS = [
  { label: '📋 How to report', query: 'How do I report a maintenance issue?' },
  { label: '🏷️ Suggest category', query: 'Suggest the right category for a broken air conditioner' },
  { label: '🔄 Status meanings', query: 'What does In Progress status mean?' },
  { label: '✍️ Draft complaint', query: 'Help me draft a clear issue description for a leaking pipe' },
  { label: '🇵🇰 اردو میں مدد', query: 'کیمپس میں شکایت کیسے درج کریں؟' },
];

export function CampusFixAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // AI Provider & Language Settings
  const [provider, setProvider] = useState<'gemini' | 'groq'>('gemini');
  const [language, setLanguage] = useState<'en' | 'ur' | 'roman_ur'>('en');

  // Voice Mode & Audio Playback
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I'm **CampusFix AI**, your smart facilities assistant. 🤖\n\nI can help you report issues, choose categories, track repair statuses, and answer campus maintenance questions in **English, Urdu, or Roman Urdu**.\n\n🎙️ *Voice Mode enabled:* Use the microphone button to speak, or click the speaker to listen!`,
      time: 'Just now',
      model: 'CampusFix Smart Engine',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized, messages]);

  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setCurrentlyPlayingId(null);
  };

  // -------------------------------------------------------------
  // SPEECH-TO-TEXT: Groq Whisper (whisper-large-v3-turbo)
  // -------------------------------------------------------------
  const startRecording = async () => {
    try {
      stopAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        await handleTranscribeAudio(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      alert('Could not access microphone. Please allow microphone permissions in your browser.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      formData.append('language', language === 'ur' ? 'ur' : 'en');

      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transcription failed');
      }

      if (data.text) {
        // Put recognized text in input field so user can inspect and edit
        setInput((prev) => (prev ? `${prev} ${data.text}` : data.text));
      }
    } catch (err: any) {
      console.error('Whisper STT error:', err);
      alert(`Speech recognition notice: ${err?.message || 'Failed to transcribe audio'}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  // -------------------------------------------------------------
  // TEXT-TO-SPEECH: Groq Orpheus (canopylabs/orpheus-v1-english)
  // -------------------------------------------------------------
  const playSpeech = async (msgId: string, textToSpeak: string) => {
    if (currentlyPlayingId === msgId && isPlayingAudio) {
      stopAudio();
      return;
    }

    stopAudio();
    setIsPlayingAudio(true);
    setCurrentlyPlayingId(msgId);

    try {
      // If language is Urdu, Orpheus is English-focused, so use browser TTS as fallback
      if (language === 'ur') {
        if ('speechSynthesis' in window) {
          const cleanText = textToSpeak.replace(/[#*`_]/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = 'ur-PK';
          utterance.onend = () => stopAudio();
          utterance.onerror = () => stopAudio();
          window.speechSynthesis.speak(utterance);
          return;
        }
      }

      // Call Groq Orpheus API
      const res = await fetch('/api/ai/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: textToSpeak,
          model: 'canopylabs/orpheus-v1-english',
          voice: 'autumn',
          response_format: 'wav',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        console.warn('Groq Orpheus API unavailable, using browser speech synthesis:', errJson);

        // Fallback to browser SpeechSynthesis
        if ('speechSynthesis' in window) {
          const cleanText = textToSpeak.replace(/[#*`_]/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = 'en-US';
          utterance.onend = () => stopAudio();
          utterance.onerror = () => stopAudio();
          window.speechSynthesis.speak(utterance);
          return;
        }
        stopAudio();
        return;
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        stopAudio();
      };
      audio.onerror = () => {
        stopAudio();
      };

      await audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      stopAudio();
    }
  };

  // -------------------------------------------------------------
  // SEND MESSAGE: Connects to /api/ai/chat
  // -------------------------------------------------------------
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    stopAudio();

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
        body: JSON.stringify({
          messages: history,
          provider,
          language,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || data.error || 'No response returned.';
      const newMsgId = (Date.now() + 1).toString();

      const aiReply: Message = {
        id: newMsgId,
        sender: 'ai',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: data.provider,
        model: data.model,
      };

      setMessages((prev) => [...prev, aiReply]);

      // If Voice Mode is active and message succeeded, speak automatically
      if (isVoiceMode && replyText) {
        setTimeout(() => playSpeech(newMsgId, replyText), 200);
      }
    } catch (err: any) {
      console.error('CampusFix AI Chat error:', err);
      const errorReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Sorry, I encountered an issue connecting to the AI backend. Please verify your network and credentials.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    stopAudio();
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Hello! I'm **CampusFix AI**, your smart facilities assistant. 🤖\n\nNeed help reporting a broken facility, choosing the right category, or tracking an existing maintenance request? Ask me anything!`,
        time: 'Just now',
        model: 'CampusFix Smart Engine',
      },
    ]);
  };

  // Helper to render markdown-like formatting cleanly
  const renderMessageText = (text: string) => {
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {text.split('\n').map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 mt-2 text-sm sm:text-base border-b border-slate-200/60 pb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }

          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-[#0D9488] font-bold leading-tight mt-0.5">•</span>
                <span>{formatBoldText(line.substring(2))}</span>
              </div>
            );
          }

          const numMatch = line.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="font-semibold text-teal-700 min-w-[1.2rem]">{numMatch[1]}.</span>
                <span>{formatBoldText(numMatch[2])}</span>
              </div>
            );
          }

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
                Smart Assistant
              </div>
              <div className="text-sm font-bold text-white leading-tight flex items-center gap-1">
                CampusFix AI <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
            </div>
          </button>

          {/* Hover Tooltip on desktop */}
          <div className="hidden group-hover:block absolute bottom-full right-0 mb-3 w-60 p-2.5 bg-slate-900 text-white text-xs rounded-xl shadow-xl pointer-events-none transition-opacity">
            <p className="font-semibold text-teal-300 flex items-center gap-1 mb-0.5">
              <Bot className="w-3.5 h-3.5" /> Ask CampusFix AI
            </p>
            <p className="text-slate-300 text-[11px]">
              Powered by Gemini & Groq. Talk with voice (Whisper & Orpheus) or text in English & Urdu!
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
              : 'w-[92vw] sm:w-[440px] h-[620px] max-h-[88vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#102A43] via-[#163654] to-[#0D9488] p-3 text-white flex items-center justify-between shadow-sm select-none">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40">
                  <Bot className="w-4 h-4 text-teal-200" />
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border-2 border-[#102A43] rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-tight">CampusFix AI</h3>
                  <span className="text-[9px] bg-teal-500/30 text-teal-200 font-semibold px-1 py-0.5 rounded border border-teal-400/30">
                    Voice & Text
                  </span>
                </div>
                <p className="text-[10px] text-teal-100/80 leading-none mt-0.5">
                  Gemini & Groq Multilingual Support
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Voice Mode Toggle */}
              <button
                onClick={() => setIsVoiceMode(!isVoiceMode)}
                title={isVoiceMode ? 'Voice Mode Active' : 'Enable Voice Mode'}
                aria-label="Toggle Voice Mode"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                  isVoiceMode
                    ? 'bg-emerald-500 text-white font-bold'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>

              {!isMinimized && (
                <button
                  onClick={handleClear}
                  title="Reset conversation"
                  aria-label="Reset conversation"
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  stopAudio();
                  setIsOpen(false);
                }}
                title="Close"
                aria-label="Close chat"
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subheader Toolbar: AI Provider & Language Selection */}
          {!isMinimized && (
            <div className="px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-teal-600" />
                <span className="font-semibold text-slate-700">Model:</span>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="gemini">Gemini (gemini-4-hydrogen)</option>
                  <option value="groq">Groq (gpt-oss-120b)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-indigo-600" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="ur">اردو (Urdu)</option>
                  <option value="roman_ur">Roman Urdu</option>
                </select>
              </div>
            </div>
          )}

          {/* Main Body (hidden when minimized) */}
          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm relative group ${
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

                      {/* Speaker Button on Assistant Message */}
                      {msg.sender === 'ai' && (
                        <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono text-[9px] text-teal-700">
                            {msg.model || (provider === 'gemini' ? 'gemini-4-hydrogen' : 'gpt-oss-120b')}
                          </span>

                          <button
                            onClick={() => playSpeech(msg.id, msg.text)}
                            title={currentlyPlayingId === msg.id && isPlayingAudio ? 'Stop speaking' : 'Read aloud with Orpheus'}
                            aria-label="Read response aloud"
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-teal-700 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-100"
                          >
                            {currentlyPlayingId === msg.id && isPlayingAudio ? (
                              <>
                                <Square className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse" />
                                <span className="text-rose-600 font-semibold">Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3 text-teal-600" />
                                <span>Speak</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                      {msg.time}
                    </span>
                  </div>
                ))}

                {/* Loading / Speaking Indicators */}
                {loading && (
                  <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 rounded-2xl rounded-bl-none px-3.5 py-2.5 shadow-sm w-fit">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span className="text-xs font-medium text-slate-600 ml-1">
                      {provider === 'gemini' ? 'Gemini 4 Hydrogen thinking...' : 'Groq 120B reasoning...'}
                    </span>
                  </div>
                )}

                {isTranscribing && (
                  <div className="flex items-center gap-2 text-teal-700 bg-teal-50 border border-teal-200 rounded-2xl px-3.5 py-2 shadow-sm w-fit">
                    <Mic className="w-4 h-4 text-teal-600 animate-pulse" />
                    <span className="text-xs font-semibold">
                      Whisper Large v3 Turbo transcribing speech...
                    </span>
                  </div>
                )}

                {isPlayingAudio && (
                  <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1 shadow-sm w-fit text-xs">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse text-indigo-600" />
                    <span>Orpheus TTS playing audio...</span>
                    <button
                      onClick={stopAudio}
                      className="ml-1 text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      [Stop]
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 overflow-x-auto whitespace-nowrap flex items-center gap-1.5 scrollbar-thin">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 pl-1">
                  <Lightbulb className="w-3 h-3 text-amber-500" /> Prompts:
                </span>
                {QUICK_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.query)}
                    disabled={loading || isRecording}
                    className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-white border border-slate-300 text-slate-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 transition-colors shadow-2xs font-medium cursor-pointer disabled:opacity-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Recording Status Banner */}
              {isRecording && (
                <div className="px-3 py-2 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-700 animate-pulse">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                    Recording voice input with microphone...
                  </div>
                  <button
                    onClick={stopRecording}
                    className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
                  >
                    Done Speaking
                  </button>
                </div>
              )}

              {/* Input Form with Voice Button */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5"
              >
                {/* Voice Input Button (Groq Whisper STT) */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={loading || isTranscribing}
                  title={isRecording ? 'Click to stop recording' : 'Speak with Whisper'}
                  aria-label="Microphone Speech to Text"
                  className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse shadow-md'
                      : 'bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-[#0D9488] border border-slate-300'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isRecording
                      ? 'Listening to your voice...'
                      : language === 'ur'
                      ? 'اپنا سوال یا مسئلہ لکھیں یا مائیک دبائیں...'
                      : 'Type a question or click the mic to speak...'
                  }
                  disabled={loading || isRecording}
                  className="flex-1 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading || isRecording}
                  aria-label="Send message to AI"
                  className="bg-[#0D9488] hover:bg-teal-700 disabled:bg-slate-300 text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:cursor-not-allowed active:scale-95 shrink-0"
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
