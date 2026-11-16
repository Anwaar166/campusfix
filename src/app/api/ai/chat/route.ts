import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(req: NextRequest) {
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
      return NextResponse.json(
        { error: 'Messages array is required.' },
        { status: 400 }
      );
    }

    const latestMessage = messages[messages.length - 1]?.content || '';
    const query = latestMessage.toLowerCase().trim();

    // System prompt tailored for CampusFix Facilities & Issue Management
    const systemPrompt = `You are CampusFix AI, the intelligent smart campus facilities maintenance assistant for university students, faculty, and administrators.
You assist users with:
1. Understanding the campus issue reporting workflow (Submitted -> Under Review -> In Progress -> Resolved -> Closed).
2. Drafting clear, high-impact maintenance problem descriptions.
3. Suggesting correct issue categories (Plumbing & Water, Electrical & Lighting, HVAC & Temperature, IT & Wi-Fi, Carpentry & Furniture, Custodial & Cleaning, Safety & Accessibility).
4. Suggesting appropriate urgency levels (Low, Medium, High, Critical).
5. Explaining community upvoting and how it prioritizes tickets for administrative triage.
6. Summarizing reports and answering questions in English, Urdu, or Roman Urdu according to user preference.
Keep responses helpful, concise, well-structured with markdown headings, bullets, and bold text.`;

    // -------------------------------------------------------------
    // PROVIDER 1: GROQ CHAT API (openai/gpt-oss-120b)
    // -------------------------------------------------------------
    if (provider === 'groq') {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) {
        return NextResponse.json({
          reply: `⚠️ **Groq API Key Not Configured**\n\nPlease add \`GROQ_API_KEY=your_key\` in your \`.env.local\` file or Vercel Environment Variables to use the **openai/gpt-oss-120b** multilingual model.\n\n*(You can switch to Gemini or ask a general campus question below in the meantime.)*`,
          provider: 'groq',
          model: 'openai/gpt-oss-120b',
          error: 'GROQ_API_KEY is not set.',
        });
      }

      try {
        // Attempt using groq-sdk or fallback to Groq OpenAI-compatible REST API
        let GroqClass: any = null;
        try {
          const groqModule = await import('groq-sdk');
          GroqClass = groqModule.default || groqModule;
        } catch {
          // Fall through to REST API
        }

        if (GroqClass) {
          const groq = new GroqClass({ apiKey: groqKey });

          if (stream) {
            const chatCompletion = await groq.chat.completions.create({
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map((m) => ({ role: m.role, content: m.content })),
              ],
              model: 'openai/gpt-oss-120b',
              temperature: 1,
              max_completion_tokens: 2048,
              top_p: 1,
              stream: true,
              reasoning_effort: 'medium',
              stop: null,
            });

            const textEncoder = new TextEncoder();
            const readableStream = new ReadableStream({
              async start(controller) {
                try {
                  for await (const chunk of chatCompletion) {
                    const text = chunk.choices[0]?.delta?.content || '';
                    if (text) {
                      controller.enqueue(textEncoder.encode(text));
                    }
                  }
                  controller.close();
                } catch (streamErr) {
                  controller.error(streamErr);
                }
              },
            });

            return new Response(readableStream, {
              headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'X-AI-Provider': 'groq',
                'X-AI-Model': 'openai/gpt-oss-120b',
              },
            });
          }

          // Non-streaming completion
          const completion = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
            ],
            model: 'openai/gpt-oss-120b',
            temperature: 1,
            max_completion_tokens: 2048,
            top_p: 1,
            stream: false,
            reasoning_effort: 'medium',
            stop: null,
          });

          const replyText = completion.choices[0]?.message?.content || '';
          return NextResponse.json({
            reply: replyText,
            provider: 'groq',
            model: 'openai/gpt-oss-120b',
          });
        } else {
          // REST API fallback for Groq
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: 'openai/gpt-oss-120b',
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map((m) => ({ role: m.role, content: m.content })),
              ],
              temperature: 1,
              max_completion_tokens: 2048,
              top_p: 1,
              reasoning_effort: 'medium',
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            return NextResponse.json({
              reply: `❌ **Groq API Error (${res.status})**\n\n\`${data?.error?.message || JSON.stringify(data)}\`\n\nModel attempted: \`openai/gpt-oss-120b\`.`,
              provider: 'groq',
              model: 'openai/gpt-oss-120b',
              error: data?.error?.message,
            });
          }

          return NextResponse.json({
            reply: data.choices?.[0]?.message?.content || '',
            provider: 'groq',
            model: 'openai/gpt-oss-120b',
          });
        }
      } catch (groqErr: any) {
        console.error('Groq Chat Execution Error:', groqErr);
        return NextResponse.json({
          reply: `❌ **Groq Error**: ${groqErr?.message || 'Failed to complete request with model openai/gpt-oss-120b'}.\n\nPlease verify model permissions and API key.`,
          provider: 'groq',
          model: 'openai/gpt-oss-120b',
          error: groqErr?.message,
        });
      }
    }

    // -------------------------------------------------------------
    // PROVIDER 2: GOOGLE GEMINI API (models/gemini-4-hydrogen)
    // -------------------------------------------------------------
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        let GoogleGenAIClass: any = null;
        try {
          const genaiMod = await import('@google/genai');
          GoogleGenAIClass = genaiMod.GoogleGenAI;
        } catch {
          // Fall through to REST API
        }

        const promptText = `${systemPrompt}\n\nUser Question:\n${latestMessage}`;

        if (GoogleGenAIClass) {
          const ai = new GoogleGenAIClass({ apiKey: geminiKey });

          try {
            // Reference implementation: ai.interactions.create with exact requested model
            const interaction = await ai.interactions.create({
              model: 'models/gemini-4-hydrogen',
              input: promptText,
              tools: [{ type: 'google_search' }],
              generation_config: {
                max_output_tokens: 65536,
                thinkingLevel: 'high',
              },
            });

            const lastStep = interaction.steps?.at(-1);
            const geminiReply =
              lastStep?.text ||
              lastStep?.output ||
              interaction.output_text ||
              (typeof interaction === 'string' ? interaction : '');

            if (geminiReply) {
              return NextResponse.json({
                reply: geminiReply,
                provider: 'gemini',
                model: 'models/gemini-4-hydrogen',
              });
            }
          } catch (modelErr: any) {
            console.warn(
              'models/gemini-4-hydrogen interaction error, testing models.generateContent fallback:',
              modelErr?.message
            );

            // Report exact error if model is unavailable
            return NextResponse.json({
              reply: `⚠️ **Gemini Model Notice**\n\nThe requested model \`models/gemini-4-hydrogen\` returned: \`${modelErr?.message || 'Model or Interactions API not available'}\`.\n\nPlease verify this preview model identifier on your Google Cloud / AI Studio project.`,
              provider: 'gemini',
              model: 'models/gemini-4-hydrogen',
              error: modelErr?.message,
            });
          }
        } else {
          // Direct REST API to test models/gemini-4-hydrogen
          const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-4-hydrogen:generateContent?key=${geminiKey}`;
          const res = await fetch(restUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: promptText }] }],
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            return NextResponse.json({
              reply: `⚠️ **Gemini API (${res.status})**: \`${data?.error?.message || 'Model gemini-4-hydrogen returned an error'}\`.\n\nPlease check if your Gemini API key has access to \`models/gemini-4-hydrogen\`.`,
              provider: 'gemini',
              model: 'models/gemini-4-hydrogen',
              error: data?.error?.message,
            });
          }

          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          return NextResponse.json({
            reply: generatedText || 'No response generated.',
            provider: 'gemini',
            model: 'models/gemini-4-hydrogen',
          });
        }
      } catch (geminiCatchErr: any) {
        console.error('Gemini API Error:', geminiCatchErr);
        return NextResponse.json({
          reply: `❌ **Gemini Error**: \`${geminiCatchErr?.message || 'Failed connecting to Gemini'}\` with model \`models/gemini-4-hydrogen\`.`,
          provider: 'gemini',
          model: 'models/gemini-4-hydrogen',
          error: geminiCatchErr?.message,
        });
      }
    }

    // -------------------------------------------------------------
    // BUILT-IN CAMPUS KNOWLEDGE ENGINE (Fallback when API key not set)
    // -------------------------------------------------------------
    let fallbackReply = '';
    if (query.includes('how to report') || query.includes('report an issue') || query.includes('report maintenance')) {
      fallbackReply = `### 📋 How to Report a Campus Issue in 4 Simple Steps:

1. **Sign In**: Ensure you are logged into your Student or Faculty account.
2. **Navigate to Report**: Click the **"Report Issue"** button in the top navigation or dashboard.
3. **Fill in Details**:
   - **Title**: Clear and concise (e.g., *"Leaking sink in Engineering Hall 2nd floor restroom"*).
   - **Category**: Select the relevant department (e.g., *Plumbing, Electrical, IT, HVAC*).
   - **Location**: Specific building name, floor, and room number.
   - **Urgency**: Choose *Low*, *Medium*, *High*, or *Critical*.
   - **Description**: Add symptoms, audio voice notes (via the 🎙️ mic button), or safety concerns.
4. **Submit & Track**: Your report enters the triage queue. You can track progress in real-time!`;
    } else if (query.includes('status') || query.includes('progress') || query.includes('under review')) {
      fallbackReply = `### 🔄 Understanding CampusFix Issue Statuses:

- 🟡 **Open**: Report submitted and waiting in the triage queue for administrative review.
- 🔵 **Under Review**: Facilities dispatchers have examined the issue and are planning the repair schedule.
- 🟣 **In Progress**: A maintenance technician or team has been assigned and is actively working on-site.
- 🟢 **Resolved**: The physical repair is completed, tested, and marked resolved with official technician notes.
- ⚪ **Closed**: The reporter has verified the fix or the ticket has completed its verification period.
- 🔴 **Rejected / Duplicate**: Ticket identified as duplicate or outside facilities scope.`;
    } else if (query.includes('category') || query.includes('categories')) {
      fallbackReply = `### 🏷️ Recommended Campus Categories:

- 🚰 **Plumbing & Water**: Leaking pipes, clogged drains, toilet repairs, water dispensers.
- ⚡ **Electrical & Lighting**: Blown bulbs, flickering hallway fixtures, wall outlet shorts.
- ❄️ **HVAC & Temperature**: Classroom too cold/hot, AC unit noise, broken thermostats.
- 💻 **IT & Wi-Fi**: Weak access points, projector failures, podium audio issues.
- 🚪 **Carpentry & Furniture**: Broken student desks, jammed doors, damaged window locks.
- 🧹 **Custodial & Cleaning**: Spill cleanups, restroom replenishment, trash overflow.
- 🚨 **Safety & Accessibility**: Broken elevator, cracked stairs, unlit walkways.`;
    } else if (query.includes('water') || query.includes('leak')) {
      fallbackReply = `### 🚰 Plumbing & Water Leakage Advice:
- **Recommended Category**: **Plumbing & Water**
- **Recommended Urgency**: **High** or **Critical** if flooding near electrical fixtures.
- **Safety Precaution**: Please caution students to stay away from wet surfaces. If water is near electrical outlets, notify campus security immediately!`;
    } else if (query.includes('urdu') || language === 'ur' || language === 'roman_ur') {
      fallbackReply = `### 🇵🇰 کیمپس فکس معاونت (اردو / Roman Urdu):

- **شکایت درج کرنے کا طریقہ**: "Report Issue" پر کلک کریں، عمارت اور کمرہ نمبر منتخب کریں، اور مسئلہ بیان کریں۔
- **آواز کے ذریعے اندراج**: اب آپ 🎙️ مائیک بٹن دبا کر بول سکتے ہیں اور Whisper AI خود بخود آپ کی آواز کو متن میں تبدیل کر دے گا!
- **اسٹیٹس چیک**: آپ ڈیش بورڈ پر اپنی تمام شکایات کی موجودہ پیش رفت دیکھ سکتے ہیں۔`;
    } else {
      fallbackReply = `Hello! I'm **CampusFix AI**, your intelligent campus facilities assistant. 🤖

I can help you:
- 📝 **Report Issues**: Guidance on titles, descriptions, building locations, and urgency.
- 🏷️ **Select Categories**: Plumbing, Electrical, HVAC, IT, Custodial, Safety.
- 🔄 **Track Maintenance**: Explaining what Open, In Progress, and Resolved mean.
- 🎙️ **Voice Assistance**: Use the microphone button to dictate your questions or complaints!

*(Note: Add \`GEMINI_API_KEY\` or \`GROQ_API_KEY\` to your environment to activate live neural model processing.)*`;
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
