/**
 * CampusFix n8n Automation Integration
 * 
 * Supports 4 core automated workflows:
 * 1. new_issue: Triggered when a student/faculty reports a new maintenance issue
 * 2. status_change: Triggered when an issue is assigned, moved to in_progress, or resolved
 * 3. reminder_unresolved: Triggered periodically or on-demand for stagnant/unresolved high-priority issues
 * 4. weekly_summary: Triggered to generate and dispatch weekly campus facilities analytics digest
 */

export type N8nEventType = 
  | 'new_issue' 
  | 'status_change' 
  | 'reminder_unresolved' 
  | 'weekly_summary';

export interface N8nPayload {
  event: N8nEventType;
  timestamp: string;
  data: Record<string, any>;
}

export async function triggerN8nWebhook(
  event: N8nEventType,
  data: Record<string, any>
): Promise<{ success: boolean; dispatched: boolean; message?: string }> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  const payload: N8nPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // If no n8n webhook URL is configured in the environment, log gracefully
  if (!webhookUrl) {
    console.info(`[n8n Webhook: ${event}] (N8N_WEBHOOK_URL not configured - event logged):`, {
      event,
      timestamp: payload.timestamp,
      summary: data.title || data.issueId || data.status || 'system_event',
    });
    return {
      success: true,
      dispatched: false,
      message: 'N8N_WEBHOOK_URL not configured. Event captured locally.',
    };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'CampusFix-System/1.0',
    };

    if (webhookSecret) {
      headers['X-CampusFix-Secret'] = webhookSecret;
      headers['Authorization'] = `Bearer ${webhookSecret}`;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`[n8n Webhook Warning] ${event} responded with HTTP ${response.status}`);
      return {
        success: false,
        dispatched: true,
        message: `Webhook failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      dispatched: true,
      message: `Successfully dispatched ${event} to n8n`,
    };
  } catch (err: any) {
    console.error(`[n8n Webhook Error] Failed to dispatch ${event}:`, err?.message || err);
    return {
      success: false,
      dispatched: false,
      message: err?.message || 'Network error triggering webhook',
    };
  }
}
