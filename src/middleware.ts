import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');
  const url = req.nextUrl;

  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin')) {
    const pwd = process.env.ADMIN_PASSWORD || 'admin';

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwdInput] = atob(authValue).split(':');

      if (pwdInput === pwd) {
        return NextResponse.next();
      }
    }

    return new NextResponse('Auth required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin', '/api/admin/:path*'],
};
