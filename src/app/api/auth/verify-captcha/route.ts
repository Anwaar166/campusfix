import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body as { token?: string };

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please complete the Google reCAPTCHA verification before submitting.' },
        { status: 400 }
      );
    }

    // 1. Google reCAPTCHA Verification (using RECAPTCHA_SECRET_KEY from .env.local)
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;

    if (recaptchaSecret && recaptchaSecret !== 'your_secret_key') {
      const formData = new URLSearchParams();
      formData.append('secret', recaptchaSecret);
      formData.append('response', token);

      const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
      if (clientIp) {
        formData.append('remoteip', clientIp.split(',')[0].trim());
      }

      const googleRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await googleRes.json();

      if (!data.success) {
        console.warn('Google reCAPTCHA rejected token:', data['error-codes']);
        const errorCodes: string[] = data['error-codes'] || [];

        let userError = 'Google reCAPTCHA verification failed. Please try again.';
        if (errorCodes.includes('timeout-or-duplicate')) {
          userError = 'reCAPTCHA expired or was already used. Please click the checkbox again.';
        } else if (errorCodes.includes('invalid-input-response')) {
          userError = 'Invalid reCAPTCHA response token. Please click the checkbox again.';
        }

        return NextResponse.json(
          {
            success: false,
            error: userError,
            errorCodes,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        verifiedBy: 'google_recaptcha',
        challenge_ts: data.challenge_ts,
        hostname: data.hostname,
      });
    }

    // 2. Secondary fallback: Cloudflare Turnstile if configured
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret && turnstileSecret !== 'your_secret_key' && !turnstileSecret.startsWith('1x000')) {
      const formData = new URLSearchParams();
      formData.append('secret', turnstileSecret);
      formData.append('response', token);

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
        console.warn('Cloudflare Turnstile rejected token:', data['error-codes']);
        return NextResponse.json(
          {
            success: false,
            error: 'Security challenge failed. Please verify again.',
            errorCodes: data['error-codes'],
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        verifiedBy: 'cloudflare',
        challenge_ts: data.challenge_ts,
      });
    }

    // 3. Development / Test Fallback
    if (token.length >= 8) {
      return NextResponse.json({
        success: true,
        verifiedBy: 'campusfix_guard',
        challenge_ts: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid security challenge response. Please try again.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('CAPTCHA verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error processing CAPTCHA verification.' },
      { status: 500 }
    );
  }
}
