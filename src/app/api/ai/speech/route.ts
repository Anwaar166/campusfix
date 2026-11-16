import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json(
        {
          error: 'GROQ_API_KEY is not configured on the server. Please add GROQ_API_KEY to your environment variables to enable Orpheus voice speech generation.',
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const {
      input,
      model = 'canopylabs/orpheus-v1-english',
      voice = 'autumn',
      response_format = 'wav',
    } = body as {
      input?: string;
      model?: string;
      voice?: string;
      response_format?: string;
    };

    if (!input || !input.trim()) {
      return NextResponse.json(
        { error: 'Input text is required for speech synthesis.' },
        { status: 400 }
      );
    }

    // Clean markdown headings, bullets, asterisks for natural reading
    const cleanText = input
      .replace(/###\s+/g, '')
      .replace(/\*\*/g, '')
      .replace(/[-*•]\s+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .slice(0, 1500)
      .trim();

    // Send request to Groq Speech endpoint: https://api.groq.com/openai/v1/audio/speech
    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model,
        voice,
        response_format,
        input: cleanText,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq Orpheus TTS Error:', errText);
      return NextResponse.json(
        {
          error: `Groq Speech API returned status ${groqRes.status}: ${errText}`,
          model,
          voice,
        },
        { status: groqRes.status }
      );
    }

    const audioArrayBuffer = await groqRes.arrayBuffer();

    return new Response(audioArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioArrayBuffer.byteLength.toString(),
        'X-AI-Model': model,
        'X-AI-Voice': voice,
      },
    });
  } catch (error: any) {
    console.error('API /api/ai/speech error:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error generating voice speech.' },
      { status: 500 }
    );
  }
}
