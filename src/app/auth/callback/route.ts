import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as any;
  const errorParam = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // If Supabase returned an explicit error in callback URL
  if (errorParam) {
    const errorUrl = new URL('/verify-email', requestUrl.origin);
    errorUrl.searchParams.set('status', 'failed');
    errorUrl.searchParams.set('reason', errorDescription || errorParam);
    return NextResponse.redirect(errorUrl);
  }

  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Handle OTP Token Hash (typical Supabase email confirmation link)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (!error) {
      const successUrl = new URL('/verify-email', requestUrl.origin);
      successUrl.searchParams.set('status', 'success');
      const successResponse = NextResponse.redirect(successUrl);
      response.cookies.getAll().forEach((c) => {
        successResponse.cookies.set(c.name, c.value);
      });
      return successResponse;
    } else {
      console.warn('Supabase verifyOtp failed:', error.message);
      const failUrl = new URL('/verify-email', requestUrl.origin);
      failUrl.searchParams.set('status', 'failed');
      failUrl.searchParams.set('reason', error.message);
      return NextResponse.redirect(failUrl);
    }
  }

  // 2. Handle PKCE Code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const successUrl = new URL('/verify-email', requestUrl.origin);
      successUrl.searchParams.set('status', 'success');
      const successResponse = NextResponse.redirect(successUrl);
      response.cookies.getAll().forEach((c) => {
        successResponse.cookies.set(c.name, c.value);
      });
      return successResponse;
    } else {
      console.warn('Supabase exchangeCodeForSession failed:', error.message);
      const failUrl = new URL('/verify-email', requestUrl.origin);
      failUrl.searchParams.set('status', 'failed');
      failUrl.searchParams.set('reason', error.message);
      return NextResponse.redirect(failUrl);
    }
  }

  // If no code, token_hash, or recognized auth payload was provided
  const invalidUrl = new URL('/verify-email', requestUrl.origin);
  invalidUrl.searchParams.set('status', 'failed');
  invalidUrl.searchParams.set('reason', 'Verification token is missing or has already been used.');
  return NextResponse.redirect(invalidUrl);
}
