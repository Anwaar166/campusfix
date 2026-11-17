import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ---------------------------------------------------------------------------
// Concise, accurate system prompt — shared by both Gemini and Groq
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are CampusFix AI, the campus facilities maintenance assistant for university students, faculty, and administrators.

Core responsibilities:
- Help users report campus maintenance issues with correct categories and urgency levels.
- Explain the issue workflow: Submitted → Under Review → In Progress → Resolved → Closed.
- Categories: Plumbing & Water, Electrical & Lighting, HVAC & Temperature, IT & Wi-Fi, Carpentry & Furniture, Custodial & Cleaning, Safety & Accessibility.
- Urgency levels: Low, Medium, High, Critical.
- Explain community upvoting and administrative triage.

Rules:
- Give accurate, helpful, concise answers. Provide detail only when asked.
- Never invent complaint IDs, statuses, resolution dates, or user data.
- If information is unavailable, say so clearly.
- Ask a clarification question only when necessary.
- Use markdown headings, bullets, and bold for structure.`;

// ---------------------------------------------------------------------------
// Adaptive complexity — decides thinking/reasoning level per question
// ---------------------------------------------------------------------------
function detectComplexity(query: string): 'low' | 'medium' | 'high' {
  const q = query.toLowerCase();
  const high = [
    'security', 'permission', 'database', 'debug', 'troubleshoot',
    'architecture', 'integration', 'configure', 'deploy', 'migration',
    'explain in detail', 'step by step', 'compare', 'analyze',
  ];
  const medium = [
    'how to', 'explain', 'difference', 'best practice', 'recommend',
    'list all', 'comprehensive', 'why does', 'what happens when',
  ];
  if (high.some((p) => q.includes(p))) return 'high';
  if (medium.some((p) => q.includes(p))) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// Conversation history optimizer — keep last N turns, skip empties
// ---------------------------------------------------------------------------
function optimizeHistory(messages: ChatMessage[], maxTurns = 5): ChatMessage[] {
  const useful = messages.filter(
    (m) => m.content.trim().length > 0 && m.role !== 'system'
  );
  const cap = maxTurns * 2;
  return useful.length <= cap ? useful : useful.slice(-cap);
}

// ---------------------------------------------------------------------------
// NDJSON streaming helpers
// ---------------------------------------------------------------------------
function ndjson(obj: Record<string, unknown>): string {
  return JSON.stringify(obj) + '\n';
}

function ndjsonStream(
  gen: (signal: AbortSignal) => AsyncGenerator<string, void, unknown>
): Response {
  const ac = new AbortController();
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const line of gen(ac.signal)) {
          controller.enqueue(encoder.encode(line));
        }
      } catch (err: any) {
        if (!ac.signal.aborted) {
          controller.enqueue(
            encoder.encode(ndjson({ type: 'error', message: err?.message || 'Stream error' }))
          );
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      ac.abort();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// ---------------------------------------------------------------------------
// Extract incremental text from a Gemini SSE event (defensive)
// ---------------------------------------------------------------------------
function extractGeminiText(event: any): string {
  // StepDelta → delta.content[].text
  if (event?.delta?.content && Array.isArray(event.delta.content)) {
    return event.delta.content
      .filter((p: any) => p?.text)
      .map((p: any) => p.text)
      .join('');
  }
  if (typeof event?.delta?.text === 'string') return event.delta.text;
  if (typeof event?.text === 'string') return event.text;
  return '';
}

// ===========================================================================
// MAIN ROUTE HANDLER
// ===========================================================================
export async function POST(req: NextRequest) {
  const t0 = Date.now();

  try {
    const body = await req.json();
    const {
      messages,
      provider = 'gemini',
      language = 'en',
      stream = false,
    } = body as {
      messages: ChatMessage[];
      provider?: 'gemini' | 'groq';
      language?: 'en' | 'ur' | 'roman_ur';
      stream?: boolean;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }

    const latestMessage = messages[messages.length - 1]?.content || '';
    const complexity = detectComplexity(latestMessage);
    const history = optimizeHistory(messages);

    // Build language-aware system prompt
    let sysPrompt = SYSTEM_PROMPT;
    if (language === 'ur') sysPrompt += '\n\nRespond in Urdu script.';
    else if (language === 'roman_ur') sysPrompt += '\n\nRespond in Roman Urdu.';

    // =======================================================================
    // PROVIDER 1: GROQ (openai/gpt-oss-120b) — unchanged model, optimized
    // =======================================================================
    if (provider === 'groq') {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) {
        return NextResponse.json({
          reply: `⚠️ **Groq API Key Not Configured**\n\nAdd \`GROQ_API_KEY\` to your environment variables to use **openai/gpt-oss-120b**.`,
          provider: 'groq',
          model: 'openai/gpt-oss-120b',
          error: 'GROQ_API_KEY is not set.',
        });
      }

      try {
        let GroqClass: any = null;
        try {
          const groqModule = await import('groq-sdk');
          GroqClass = groqModule.default || groqModule;
        } catch {
          // Fall through to REST
        }

        const groqMessages = [
          { role: 'system' as const, content: sysPrompt },
          ...history.map((m) => ({ role: m.role, content: m.content })),
        ];

        const reasoningEffort =
          complexity === 'high' ? 'high' : complexity === 'medium' ? 'medium' : 'low';

        // --- Groq Streaming ---
        if (stream && GroqClass) {
          return ndjsonStream(async function* (signal) {
            const groq = new GroqClass({ apiKey: groqKey });
            yield ndjson({ type: 'meta', provider: 'groq', model: 'openai/gpt-oss-120b' });

            let ttft: number | null = null;
            const chatStream = await groq.chat.completions.create({
              messages: groqMessages,
              model: 'openai/gpt-oss-120b',
              temperature: 0.6,
              max_completion_tokens: 1024,
              top_p: 1,
              stream: true,
              reasoning_effort: reasoningEffort,
              stop: null,
            });

            for await (const chunk of chatStream) {
              if (signal.aborted) break;
              const text = chunk.choices?.[0]?.delta?.content || '';
              if (text) {
                if (ttft === null) ttft = Date.now() - t0;
                yield ndjson({ type: 'delta', text });
              }
            }

            yield ndjson({
              type: 'done',
              ttft_ms: ttft ?? Date.now() - t0,
              total_ms: Date.now() - t0,
              provider: 'groq',
              model: 'openai/gpt-oss-120b',
            });
          });
        }

        // --- Groq Non-Streaming ---
        if (GroqClass) {
          const groq = new GroqClass({ apiKey: groqKey });
          const completion = await groq.chat.completions.create({
            messages: groqMessages,
            model: 'openai/gpt-oss-120b',
            temperature: 0.6,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: false,
            reasoning_effort: reasoningEffort,
            stop: null,
          });

          return NextResponse.json({
            reply: completion.choices[0]?.message?.content || '',
            provider: 'groq',
            model: 'openai/gpt-oss-120b',
            ttft_ms: Date.now() - t0,
            total_ms: Date.now() - t0,
          });
        }

        // --- Groq REST fallback ---
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: groqMessages,
            temperature: 0.6,
            max_completion_tokens: 1024,
            top_p: 1,
            reasoning_effort: reasoningEffort,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          return NextResponse.json({
            reply: `⚠️ **Groq API Error (${res.status})**: \`${data?.error?.message || 'Request failed'}\``,
            provider: 'groq',
            model: 'openai/gpt-oss-120b',
            error: data?.error?.message,
          });
        }

        return NextResponse.json({
          reply: data.choices?.[0]?.message?.content || '',
          provider: 'groq',
          model: 'openai/gpt-oss-120b',
          total_ms: Date.now() - t0,
        });
      } catch (groqErr: any) {
        console.error('Groq error:', groqErr);
        const msg = groqErr?.message || 'Failed to connect to Groq';
        let friendly = `❌ **Groq Error**: \`${msg}\``;
        if (msg.includes('429') || msg.includes('rate'))
          friendly = `⚠️ **Groq Rate Limit** — please wait a moment and try again.\n\n*Details:* \`${msg}\``;
        return NextResponse.json({
          reply: friendly,
          provider: 'groq',
          model: 'openai/gpt-oss-120b',
          error: msg,
        });
      }
    }

    // =======================================================================
    // PROVIDER 2: GOOGLE GEMINI (gemini-4-hydrogen) — optimized
    // =======================================================================
    if (provider === 'gemini') {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return NextResponse.json({
          reply: `⚠️ **Gemini API Key Not Configured**\n\nAdd \`GEMINI_API_KEY\` to your environment variables to use **gemini-4-hydrogen**.`,
          provider: 'gemini',
          model: 'gemini-4-hydrogen',
          error: 'GEMINI_API_KEY is not set.',
        });
      }

      try {
        let GoogleGenAIClass: any = null;
        try {
          const genaiMod = await import('@google/genai');
          GoogleGenAIClass = genaiMod.GoogleGenAI;
        } catch (importErr: any) {
          console.warn('Could not import @google/genai:', importErr);
        }

        // Build input: system prompt + optimized context + latest question
        const contextMessages = history.slice(0, -1); // all except the last (which is the latest question)
        let promptText = sysPrompt;
        if (contextMessages.length > 0) {
          promptText += '\n\nConversation context:\n';
          for (const m of contextMessages) {
            promptText += `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}\n`;
          }
        }
        promptText += `\nUser: ${latestMessage}`;

        // Adaptive generation config
        const thinkingLevel = complexity === 'high' ? 'high' : complexity === 'medium' ? 'medium' : 'low';
        const generationConfig = {
          max_output_tokens: complexity === 'high' ? 2048 : 1024,
          thinking_level: thinkingLevel,
        };

        if (GoogleGenAIClass) {
          const ai = new GoogleGenAIClass({ apiKey: geminiKey });

          // --- Gemini Streaming ---
          if (stream) {
            return ndjsonStream(async function* (signal) {
              yield ndjson({ type: 'meta', provider: 'gemini', model: 'gemini-4-hydrogen' });

              let ttft: number | null = null;

              try {
                const streamResponse = await ai.interactions.create({
                  model: 'gemini-4-hydrogen',
                  input: promptText,
                  stream: true,
                  generation_config: generationConfig,
                });

                for await (const event of streamResponse) {
                  if (signal.aborted) break;

                  const text = extractGeminiText(event);
                  if (text) {
                    if (ttft === null) ttft = Date.now() - t0;
                    yield ndjson({ type: 'delta', text });
                  }
                }
              } catch (streamErr: any) {
                const rawMsg = streamErr?.message || String(streamErr);
                console.error('Gemini stream error:', rawMsg);

                if (rawMsg.includes('429') || rawMsg.includes('quota') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
                  yield ndjson({
                    type: 'error',
                    message: `Rate limit exceeded for gemini-4-hydrogen. Please wait 30–60 seconds or switch to Groq.`,
                  });
                } else if (rawMsg.includes('404') || rawMsg.includes('NOT_FOUND')) {
                  yield ndjson({
                    type: 'error',
                    message: `Model gemini-4-hydrogen not found. Check your Google AI Studio project.`,
                  });
                } else if (rawMsg.includes('stream') || rawMsg.includes('not supported')) {
                  // Streaming not supported — fall back to non-streaming inline
                  yield ndjson({ type: 'info', message: 'Streaming unavailable, fetching full response...' });
                  try {
                    const fallback = await ai.interactions.create({
                      model: 'gemini-4-hydrogen',
                      input: promptText,
                      generation_config: generationConfig,
                    });
                    const text = fallback.output_text || '';
                    if (text) {
                      if (ttft === null) ttft = Date.now() - t0;
                      yield ndjson({ type: 'delta', text });
                    }
                  } catch (fbErr: any) {
                    yield ndjson({ type: 'error', message: fbErr?.message || 'Gemini request failed' });
                  }
                } else {
                  yield ndjson({ type: 'error', message: rawMsg });
                }
              }

              yield ndjson({
                type: 'done',
                ttft_ms: ttft ?? Date.now() - t0,
                total_ms: Date.now() - t0,
                provider: 'gemini',
                model: 'gemini-4-hydrogen',
              });
            });
          }

          // --- Gemini Non-Streaming ---
          try {
            const interaction = await ai.interactions.create({
              model: 'gemini-4-hydrogen',
              input: promptText,
              generation_config: generationConfig,
            });

            let geminiReply = interaction.output_text || '';
            if (!geminiReply && interaction.steps) {
              for (const step of interaction.steps) {
                if (step.type === 'model_output' && Array.isArray(step.content)) {
                  for (const part of step.content) {
                    if (part.text) geminiReply += (geminiReply ? '\n' : '') + part.text;
                  }
                }
              }
            }

            return NextResponse.json({
              reply: geminiReply.trim() || 'No response received from Gemini.',
              provider: 'gemini',
              model: 'gemini-4-hydrogen',
              ttft_ms: Date.now() - t0,
              total_ms: Date.now() - t0,
            });
          } catch (modelErr: any) {
            console.error('Gemini Interactions API error:', modelErr);
            const rawMsg = modelErr?.message || String(modelErr);
            let friendly = `⚠️ **Gemini API Error**: \`${rawMsg}\`\n\nModel: \`gemini-4-hydrogen\``;

            if (rawMsg.includes('429') || rawMsg.includes('quota') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
              friendly = `⚠️ **Gemini Rate Limit (429)** — wait 30–60 seconds or switch to Groq.\n\n*Details:* \`${rawMsg}\``;
            } else if (rawMsg.includes('404') || rawMsg.includes('NOT_FOUND')) {
              friendly = `⚠️ **Model Not Found (404)** — \`gemini-4-hydrogen\` is not enabled for your project.\n\n*Details:* \`${rawMsg}\``;
            } else if (rawMsg.includes('403') || rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('API_KEY_INVALID')) {
              friendly = `⚠️ **Permission Error (403)** — check your \`GEMINI_API_KEY\`.\n\n*Details:* \`${rawMsg}\``;
            }

            return NextResponse.json({
              reply: friendly,
              provider: 'gemini',
              model: 'gemini-4-hydrogen',
              error: rawMsg,
            });
          }
        } else {
          // --- REST API fallback (no SDK available) ---
          const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-4-hydrogen:generateContent?key=${geminiKey}`;
          const res = await fetch(restUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: promptText }] }],
              generationConfig: { maxOutputTokens: 1024 },
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            return NextResponse.json({
              reply: `⚠️ **Gemini REST API Error (${res.status})**: \`${data?.error?.message || 'Request failed'}\``,
              provider: 'gemini',
              model: 'gemini-4-hydrogen',
              error: data?.error?.message,
            });
          }

          return NextResponse.json({
            reply: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.',
            provider: 'gemini',
            model: 'gemini-4-hydrogen',
            total_ms: Date.now() - t0,
          });
        }
      } catch (geminiCatchErr: any) {
        console.error('Gemini execution error:', geminiCatchErr);
        return NextResponse.json({
          reply: `❌ **Gemini Error**: \`${geminiCatchErr?.message || 'Connection failed'}\` — model: \`gemini-4-hydrogen\``,
          provider: 'gemini',
          model: 'gemini-4-hydrogen',
          error: geminiCatchErr?.message,
        });
      }
    }

    // =======================================================================
    // BUILT-IN CAMPUS KNOWLEDGE ENGINE (Fallback when no API key)
    // =======================================================================
    const query = latestMessage.toLowerCase().trim();
    let fallbackReply = '';

    if (query.includes('how to report') || query.includes('report an issue') || query.includes('report maintenance')) {
      fallbackReply = `### 📋 How to Report a Campus Issue:\n\n1. **Sign In** to your Student or Faculty account.\n2. Click **\"Report Issue\"** in the navigation or dashboard.\n3. Fill in **Title**, **Category**, **Location**, **Urgency**, and **Description**.\n4. **Submit & Track** — your report enters the triage queue with real-time tracking!`;
    } else if (query.includes('status') || query.includes('progress') || query.includes('under review')) {
      fallbackReply = `### 🔄 Issue Statuses:\n\n- 🟡 **Open** — Submitted, awaiting triage.\n- 🔵 **Under Review** — Dispatchers planning repair.\n- 🟣 **In Progress** — Technician actively working.\n- 🟢 **Resolved** — Repair completed and tested.\n- ⚪ **Closed** — Verified by reporter.\n- 🔴 **Rejected / Duplicate** — Outside scope or already reported.`;
    } else if (query.includes('category') || query.includes('categories')) {
      fallbackReply = `### 🏷️ Issue Categories:\n\n- 🚰 **Plumbing & Water**\n- ⚡ **Electrical & Lighting**\n- ❄️ **HVAC & Temperature**\n- 💻 **IT & Wi-Fi**\n- 🚪 **Carpentry & Furniture**\n- 🧹 **Custodial & Cleaning**\n- 🚨 **Safety & Accessibility**`;
    } else if (query.includes('water') || query.includes('leak')) {
      fallbackReply = `### 🚰 Plumbing & Water Advice:\n- **Category:** Plumbing & Water\n- **Urgency:** High or Critical (if near electrical)\n- **Safety:** Keep away from wet surfaces and notify security if near outlets.`;
    } else if (query.includes('urdu') || language === 'ur' || language === 'roman_ur') {
      fallbackReply = `### 🇵🇰 کیمپس فکس معاونت:\n\n- \"Report Issue\" پر کلک کریں۔\n- عمارت، کمرہ نمبر، اور مسئلے کی تفصیل درج کریں۔\n- 🎙️ مائیک بٹن دبا کر آواز سے بھی اندراج ممکن ہے۔`;
    } else {
      fallbackReply = `Hello! I'm **CampusFix AI** 🤖\n\nI can help you:\n- 📝 Report Issues\n- 🏷️ Select Categories\n- 🔄 Track Maintenance\n- 🎙️ Voice Assistance\n\n*(Add \`GEMINI_API_KEY\` or \`GROQ_API_KEY\` to enable live AI.)*`;
    }

    return NextResponse.json({
      reply: fallbackReply,
      provider: 'built_in',
      note: 'Configure GEMINI_API_KEY or GROQ_API_KEY to enable live model reasoning.',
    });
  } catch (error: any) {
    console.error('API /api/ai/chat route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing AI chat.' },
      { status: 500 }
    );
  }
}
