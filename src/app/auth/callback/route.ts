import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as any;
  const next = requestUrl.searchParams.get('next') || '/login?verified=true';

  let redirectUrl = new URL(next, requestUrl.origin);
  let response = NextResponse.redirect(redirectUrl);

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

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (!error) {
      const successUrl = new URL('/login?verified=true', requestUrl.origin);
      const successResponse = NextResponse.redirect(successUrl);
      response.cookies.getAll().forEach((c) => {
        successResponse.cookies.set(c.name, c.value);
      });
      return successResponse;
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const successUrl = new URL('/login?verified=true', requestUrl.origin);
      const successResponse = NextResponse.redirect(successUrl);
      response.cookies.getAll().forEach((c) => {
        successResponse.cookies.set(c.name, c.value);
      });
      return successResponse;
    }
  }

  // If verification failed or expired
  return NextResponse.redirect(
    new URL('/login?error=verification_failed', requestUrl.origin)
  );
}
