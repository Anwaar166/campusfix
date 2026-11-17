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
    // PROVIDER 2: GOOGLE GEMINI API (gemini-4-hydrogen)
    // -------------------------------------------------------------
    if (provider === 'gemini') {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return NextResponse.json({
          reply: `⚠️ **Gemini API Key Not Configured**\n\nPlease add \`GEMINI_API_KEY\` to your environment variables to use the **gemini-4-hydrogen** model.`,
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
          console.warn('Could not dynamically import @google/genai:', importErr);
        }

        const promptText = `${systemPrompt}\n\nUser Question:\n${latestMessage}`;

        if (GoogleGenAIClass) {
          const ai = new GoogleGenAIClass({ apiKey: geminiKey });

          try {
            const generationConfig = {
              max_output_tokens: 65536,
              thinking_level: 'high',
            };

            // Use ai.interactions.create with exact requested model & generation config
            const interaction = await ai.interactions.create({
              model: 'gemini-4-hydrogen',
              input: promptText,
              generation_config: generationConfig,
            });

            let geminiReply = interaction.output_text;
            if (!geminiReply && interaction.steps) {
              for (const step of interaction.steps) {
                if (step.type === 'model_output' && Array.isArray(step.content)) {
                  for (const part of step.content) {
                    if (part.text) {
                      geminiReply = (geminiReply ? geminiReply + '\n' : '') + part.text;
                    }
                  }
                }
              }
            }

            if (geminiReply && geminiReply.trim().length > 0) {
              return NextResponse.json({
                reply: geminiReply.trim(),
                provider: 'gemini',
                model: 'gemini-4-hydrogen',
              });
            }

            return NextResponse.json({
              reply: 'No text response received from Gemini Interactions API.',
              provider: 'gemini',
              model: 'gemini-4-hydrogen',
            });
          } catch (modelErr: any) {
            console.error('Gemini Interactions API error with gemini-4-hydrogen:', modelErr);
            const rawMsg = modelErr?.message || modelErr?.toString() || 'Model error';
            let friendlyMessage = `⚠️ **Gemini API Error**: \`${rawMsg}\`\n\nModel: \`gemini-4-hydrogen\``;

            if (rawMsg.includes('429') || rawMsg.includes('quota') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
              friendlyMessage = `⚠️ **Gemini Rate Limit / Quota Exceeded (429)**\n\nYou have temporarily reached the rate limit or quota for \`gemini-4-hydrogen\`.\n\n*Error details:* \`${rawMsg}\`\n\n*Tip: Please wait 30–60 seconds before sending another message, or switch to Groq (120B) in the model dropdown.*`;
            } else if (rawMsg.includes('404') || rawMsg.includes('NOT_FOUND')) {
              friendlyMessage = `⚠️ **Gemini Model Not Found (404)**\n\nThe requested model \`gemini-4-hydrogen\` was not found or is not enabled for your Google Cloud / AI Studio project.\n\n*Error details:* \`${rawMsg}\``;
            } else if (rawMsg.includes('403') || rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('API_KEY_INVALID')) {
              friendlyMessage = `⚠️ **Gemini Authentication / Permission Error (403)**\n\nPlease check that your \`GEMINI_API_KEY\` is active and authorized for the Gemini Interactions API.\n\n*Error details:* \`${rawMsg}\``;
            }

            // Do not silently switch to another model - report exact error
            return NextResponse.json({
              reply: friendlyMessage,
              provider: 'gemini',
              model: 'gemini-4-hydrogen',
              error: rawMsg,
            });
          }
        } else {
          // Direct REST API fallback
          const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-4-hydrogen:generateContent?key=${geminiKey}`;
          const res = await fetch(restUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: promptText }] }],
              generationConfig: {
                maxOutputTokens: 65536,
              },
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            const restError = data?.error?.message || 'Error communicating with Gemini REST API';
            return NextResponse.json({
              reply: `⚠️ **Gemini API Error (${res.status})**: \`${restError}\`\n\nModel: \`gemini-4-hydrogen\``,
              provider: 'gemini',
              model: 'gemini-4-hydrogen',
              error: restError,
            });
          }

          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          return NextResponse.json({
            reply: generatedText || 'No response generated.',
            provider: 'gemini',
            model: 'gemini-4-hydrogen',
          });
        }
      } catch (geminiCatchErr: any) {
        console.error('Gemini Execution Error:', geminiCatchErr);
        return NextResponse.json({
          reply: `❌ **Gemini Error**: \`${geminiCatchErr?.message || 'Failed connecting to Gemini'}\` with model \`gemini-4-hydrogen\`.`,
          provider: 'gemini',
          model: 'gemini-4-hydrogen',
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
