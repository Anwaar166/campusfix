import { NextRequest, NextResponse } from 'next/server';
import { triggerN8nWebhook, N8nEventType } from '@/lib/n8n';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, data } = body as { event: N8nEventType; data: Record<string, any> };

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Missing event or data payload' },
        { status: 400 }
      );
    }

    const result = await triggerN8nWebhook(event, data);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('API /api/webhooks/n8n error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
