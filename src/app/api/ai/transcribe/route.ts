import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json(
        {
          error: 'GROQ_API_KEY is not configured on the server. Please add GROQ_API_KEY to your environment variables to enable Whisper voice transcription.',
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;
    const language = (formData.get('language') as string) || undefined;

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided in request.' },
        { status: 400 }
      );
    }

    // Validate size (max 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Audio file exceeds 25MB maximum size limit.' },
        { status: 413 }
      );
    }

    // Build Groq transcription request
    // We forward the audio to Groq Whisper endpoint: https://api.groq.com/openai/v1/audio/transcriptions
    const groqFormData = new FormData();
    groqFormData.append('file', file, 'recording.webm');
    groqFormData.append('model', 'whisper-large-v3-turbo');
    groqFormData.append('temperature', '0');
    groqFormData.append('response_format', 'verbose_json');

    if (language && language !== 'auto') {
      groqFormData.append('language', language);
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
      },
      body: groqFormData,
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      console.error('Groq Whisper Transcription Error:', data);
      return NextResponse.json(
        {
          error: data?.error?.message || 'Failed to transcribe audio with Groq Whisper.',
          model: 'whisper-large-v3-turbo',
        },
        { status: groqRes.status }
      );
    }

    return NextResponse.json({
      text: data.text || '',
      language: data.language || language || 'en',
      duration: data.duration || 0,
      model: 'whisper-large-v3-turbo',
    });
  } catch (error: any) {
    console.error('API /api/ai/transcribe error:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error processing audio transcription.' },
      { status: 500 }
    );
  }
}
