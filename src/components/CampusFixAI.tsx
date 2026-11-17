'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Pause,
  Play,
  Globe,
  Cpu,
  RotateCcw,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  StopCircle,
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
  const [voiceNotice, setVoiceNotice] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setIsStreaming(false);
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I'm **CampusFix AI**, your smart facilities assistant. 🤖\n\nI can help you report issues, choose categories, track repair statuses, and answer campus maintenance questions in **English, Urdu, or Roman Urdu**.\n\n🎙️ *Voice Mode enabled:* Use the microphone button to speak with Groq Whisper, or click the speaker to listen with Groq Orpheus!`,
      time: 'Just now',
      model: 'CampusFix Smart Engine',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showVoiceNotice = (type: 'info' | 'success' | 'error', text: string, autoHide = true) => {
    setVoiceNotice({ type, text });
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    if (autoHide) {
      noticeTimerRef.current = setTimeout(() => {
        setVoiceNotice(null);
      }, 4000);
    }
  };

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
    setIsAudioPaused(false);
    setCurrentlyPlayingId(null);
  };

  const pauseAudio = () => {
    if (currentAudioRef.current && isPlayingAudio) {
      currentAudioRef.current.pause();
      setIsAudioPaused(true);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsAudioPaused(true);
    }
  };

  const resumeAudio = () => {
    if (currentAudioRef.current && isPlayingAudio && isAudioPaused) {
      currentAudioRef.current.play();
      setIsAudioPaused(false);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsAudioPaused(false);
    }
  };

  // -------------------------------------------------------------
  // SPEECH-TO-TEXT: Groq Whisper (whisper-large-v3-turbo)
  // -------------------------------------------------------------
  const startRecording = async () => {
    if (isRecording || isTranscribing) return;

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
      showVoiceNotice('info', '🎙️ Listening... (Speak clearly into your microphone, click mic to finish)', false);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      showVoiceNotice('error', 'Microphone permission denied. Please allow microphone access in your browser.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      showVoiceNotice('info', '⏳ Processing audio with Groq Whisper (whisper-large-v3-turbo)...', false);
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
        // Put recognized text in input field so user can inspect and edit BEFORE sending
        setInput((prev) => (prev ? `${prev} ${data.text}` : data.text));
        showVoiceNotice('success', 'Transcription complete! Review and edit your text, then click Send.');
      } else {
        showVoiceNotice('info', 'No clear speech detected. Please speak closer to your microphone.');
      }
    } catch (err: any) {
      console.error('Whisper STT error:', err);
      showVoiceNotice('error', `Speech error: ${err?.message || 'Failed to transcribe audio'}`);
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
    setIsAudioPaused(false);
    setCurrentlyPlayingId(msgId);

    try {
      // Honest language check: Orpheus v1 is English-focused.
      // If language is Urdu, inform honestly and use browser SpeechSynthesis with ur-PK.
      if (language === 'ur') {
        showVoiceNotice('info', 'Orpheus TTS is English-only. Using browser speech synthesis for Urdu.');
        if ('speechSynthesis' in window) {
          const cleanText = textToSpeak.replace(/[#*`_]/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = 'ur-PK';
          utterance.onend = () => stopAudio();
          utterance.onerror = () => stopAudio();
          window.speechSynthesis.speak(utterance);
          return;
        }
        stopAudio();
        return;
      }

      // Call Groq Orpheus API endpoint
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
        console.warn('Groq Orpheus API unavailable, falling back to browser speech:', errJson);

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

      audio.onended = () => stopAudio();
      audio.onerror = () => stopAudio();

      await audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      stopAudio();
    }
  };

  // -------------------------------------------------------------
  // SEND MESSAGE: Connects to /api/ai/chat with progressive streaming
  // -------------------------------------------------------------
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    stopAudio();
    cancelGeneration();

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const aiMsgId = (Date.now() + 1).toString();
    const initialAiMsg: Message = {
      id: aiMsgId,
      sender: 'ai',
      text: '', // Start empty to show typing indicator
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      provider,
      model: provider === 'gemini' ? 'gemini-4-hydrogen' : 'openai/gpt-oss-120b',
    };

    setMessages((prev) => [...prev, userMsg, initialAiMsg]);
    setInput('');
    setLoading(true);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome' && m.id !== 'reset')
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text,
        }));
      history.push({ role: 'user', content: query });

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history,
          provider,
          language,
          stream: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.reply || `Request failed (${res.status})`);
      }

      const contentType = res.headers.get('content-type') || '';
      let accumulatedText = '';
      let detectedModel = provider === 'gemini' ? 'gemini-4-hydrogen' : 'openai/gpt-oss-120b';
      let detectedProvider: string = provider;

      // Handle NDJSON stream
      if (contentType.includes('application/x-ndjson') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const event = JSON.parse(trimmed);
              if (event.type === 'meta') {
                if (event.model) detectedModel = event.model;
                if (event.provider) detectedProvider = event.provider;
              } else if (event.type === 'delta' && typeof event.text === 'string') {
                accumulatedText += event.text;
                const currentText = accumulatedText;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? { ...msg, text: currentText, model: detectedModel, provider: detectedProvider }
                      : msg
                  )
                );
              } else if (event.type === 'done') {
                if (event.model) detectedModel = event.model;
                if (event.provider) detectedProvider = event.provider;
              } else if (event.type === 'error') {
                accumulatedText = event.message || 'Stream encountered an error.';
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? { ...msg, text: accumulatedText, model: detectedModel, provider: detectedProvider }
                      : msg
                  )
                );
              }
            } catch {
              // Ignore partial JSON parse errors
            }
          }
        }
      } else {
        // Fallback for standard JSON response
        const data = await res.json();
        accumulatedText = data.reply || data.error || 'No response returned.';
        if (data.model) detectedModel = data.model;
        if (data.provider) detectedProvider = data.provider;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? { ...msg, text: accumulatedText, model: detectedModel, provider: detectedProvider }
              : msg
          )
        );
      }

      if (!accumulatedText.trim()) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  text: '⚠️ No response was received. Please try again.',
                  model: detectedModel,
                  provider: detectedProvider,
                }
              : msg
          )
        );
      } else if (isVoiceMode) {
        setTimeout(() => playSpeech(aiMsgId, accumulatedText), 200);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  text: msg.text ? `${msg.text}\n\n*(Generation stopped)*` : '*(Generation cancelled)*',
                }
              : msg
          )
        );
      } else {
        console.error('Chat error:', err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  text: `⚠️ **Connection Error**: ${err?.message || 'Could not communicate with the AI Assistant. Please check your network and try again.'}`,
                }
              : msg
          )
        );
      }
    } finally {
      setLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleClear = () => {
    stopAudio();
    cancelGeneration();
    setMessages([
      {
        id: 'reset',
        sender: 'ai',
        text: 'Conversation cleared. How can I help you with CampusFix facilities today?',
        time: 'Just now',
      },
    ]);
  };

  // Helper to format markdown text
  const renderMessageText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-sm text-[#102A43] mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs sm:text-sm text-slate-700">
            {formatBold(line.substring(2))}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs sm:text-sm text-slate-800 leading-relaxed">
          {formatBold(line)}
        </p>
      );
    });
  };

  const formatBold = (str: string) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
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
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 font-sans print:hidden">
      {/* Floating Robot Trigger Button */}
      {!isOpen && (
        <div className="relative group">
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open CampusFix AI Assistant"
            className="flex items-center gap-2.5 sm:gap-3 bg-gradient-to-r from-[#102A43] to-[#0D9488] text-white p-3 sm:px-5 sm:py-3.5 rounded-full shadow-2xl hover:shadow-teal-500/30 hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/40 cursor-pointer"
          >
            {/* 3D Robot Avatar */}
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center shadow-inner border border-white/30 animate-pulse">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-teal-300 drop-shadow" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#102A43] rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#102A43] rounded-full" />
            </div>

            <div className="hidden sm:block text-left pr-1">
              <div className="text-[10px] font-medium tracking-wide uppercase text-teal-300 leading-none">
                Smart Assistant
              </div>
              <div className="text-sm font-bold text-white leading-tight flex items-center gap-1">
                CampusFix AI <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
            </div>
          </button>

          {/* Desktop Hover Tooltip */}
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
              ? 'w-72 sm:w-96 h-14'
              : 'w-[calc(100vw-2rem)] sm:w-[440px] max-w-lg h-[560px] max-h-[82dvh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#102A43] via-[#163654] to-[#0D9488] p-3 text-white flex items-center justify-between shadow-sm select-none shrink-0">
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
                  cancelGeneration();
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
            <div className="px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
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
                        msg.text ? (
                          renderMessageText(msg.text)
                        ) : (
                          <div className="flex items-center gap-1.5 py-1 text-xs text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                            <span className="ml-1 text-[11px] text-slate-400">
                              Streaming {provider === 'gemini' ? 'Gemini 4 Hydrogen' : 'Groq 120B'}...
                            </span>
                          </div>
                        )
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      )}

                      {/* Speaker Button on Assistant Message */}
                      {msg.sender === 'ai' && (
                        <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono text-[9px] text-teal-700">
                            {msg.model || (provider === 'gemini' ? 'gemini-4-hydrogen' : 'gpt-oss-120b')}
                          </span>

                          <div className="flex items-center gap-1">
                            {currentlyPlayingId === msg.id && isPlayingAudio ? (
                              <div className="flex items-center gap-1 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5">
                                <button
                                  type="button"
                                  onClick={isAudioPaused ? resumeAudio : pauseAudio}
                                  title={isAudioPaused ? 'Resume audio' : 'Pause audio'}
                                  className="text-teal-700 hover:text-teal-900 cursor-pointer"
                                >
                                  {isAudioPaused ? <Play className="w-3 h-3 fill-teal-700" /> : <Pause className="w-3 h-3" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={stopAudio}
                                  title="Stop audio"
                                  className="text-rose-600 hover:text-rose-800 cursor-pointer"
                                >
                                  <Square className="w-2.5 h-2.5 fill-rose-600" />
                                </button>
                                <span className="text-[9px] font-bold text-teal-800">
                                  {isAudioPaused ? 'Paused' : 'Playing'}
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => playSpeech(msg.id, msg.text)}
                                title="Read aloud with Groq Orpheus"
                                aria-label="Read response aloud"
                                className="inline-flex items-center gap-1 text-slate-500 hover:text-teal-700 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-100"
                              >
                                <Volume2 className="w-3 h-3 text-teal-600" />
                                <span>Speak</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}

                {loading && !messages.some((m) => m.sender === 'ai' && m.text === '') && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600 max-w-[70%]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                    <span>Streaming {provider === 'gemini' ? 'Gemini 4 Hydrogen' : 'Groq 120B'}...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Bar */}
              <div className="px-3 py-1.5 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar shrink-0">
                <span className="text-slate-400 font-semibold shrink-0 flex items-center gap-1 text-[10px]">
                  <Lightbulb className="w-3 h-3 text-amber-500" /> Quick:
                </span>
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(p.query)}
                    className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-600 text-[11px] transition-colors border border-slate-200/80 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Status / Listening / Voice Notice Banner */}
              {voiceNotice && (
                <div
                  className={`px-3 py-1.5 text-xs flex items-center gap-2 border-t shrink-0 ${
                    voiceNotice.type === 'info'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                      : voiceNotice.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {voiceNotice.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="flex-1 truncate">{voiceNotice.text}</span>
                  <button
                    onClick={() => setVoiceNotice(null)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Input Form with Voice Button */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5 shrink-0"
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

                {loading ? (
                  <button
                    type="button"
                    onClick={cancelGeneration}
                    title="Stop generating"
                    aria-label="Stop generation"
                    className="bg-rose-500 hover:bg-rose-600 text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                  >
                    <StopCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || isRecording}
                    aria-label="Send message to AI"
                    className="bg-[#0D9488] hover:bg-teal-700 disabled:bg-slate-300 text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:cursor-not-allowed active:scale-95 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
