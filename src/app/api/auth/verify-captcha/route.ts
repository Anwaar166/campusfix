import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body as { token?: string };

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'CAPTCHA verification token is missing. Please complete the security check.' },
        { status: 400 }
      );
    }

    const secretKey =
      process.env.TURNSTILE_SECRET_KEY || '1x00000000000000000000000000000000BB';

    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    // Optional client IP forwarding
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    if (clientIp) {
      formData.append('remoteip', clientIp.split(',')[0].trim());
    }

    const cloudflareRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    const data = await cloudflareRes.json();

    if (!data.success) {
      console.warn('Cloudflare Turnstile verification rejected:', data['error-codes']);
      return NextResponse.json(
        {
          success: false,
          error: 'Security verification failed. Please refresh and complete the CAPTCHA again.',
          errorCodes: data['error-codes'],
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      challenge_ts: data.challenge_ts,
      hostname: data.hostname,
    });
  } catch (error: any) {
    console.error('Turnstile verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error verifying security challenge.' },
      { status: 500 }
    );
  }
}
