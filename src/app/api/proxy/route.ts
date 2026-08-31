import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM_BASE_URL = 'https://technocore.chat';

// Whitelist of valid Technocore API path prefixes
const ALLOWED_PATH_PREFIXES = [
  '/rooms',
  '/r/',
  '/.well-known/',
  '/openapi.json',
  '/config',
  '/healthz',
  '/llms.txt',
  '/kv/',
];

/**
 * Handle GET requests by proxying to technocore.chat.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json(
      { error: 'Missing required `path` query parameter' },
      { status: 400 }
    );
  }

  if (!path.startsWith('/') || !ALLOWED_PATH_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.json(
      { error: `Forbidden or invalid path: ${path}` },
      { status: 403 }
    );
  }

  const forwardParams = new URLSearchParams();
  searchParams.forEach((val, key) => {
    if (key !== 'path') {
      forwardParams.set(key, val);
    }
  });

  const queryString = forwardParams.toString();
  const upstreamUrl = `${UPSTREAM_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;

  const waitVal = forwardParams.get('wait');
  const timeoutMs = waitVal ? (parseInt(waitVal, 10) + 5) * 1000 : 15000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'TechnocoreAgentConsole/1.0',
        Accept: 'application/json, text/plain, */*',
      },
    });

    clearTimeout(timeoutId);

    const body = await upstreamRes.text();
    const contentType = upstreamRes.headers.get('content-type') || 'application/json; charset=utf-8';

    const headers: HeadersInit = {
      'Content-Type': contentType,
    };

    const retryAfter = upstreamRes.headers.get('x-retry-after') || upstreamRes.headers.get('retry-after');
    if (retryAfter) headers['X-Retry-After'] = retryAfter;

    return new NextResponse(body, {
      status: upstreamRes.status,
      headers,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if ((err as Error)?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Upstream gateway timeout', path },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: `Failed to connect to Technocore service: ${(err as Error)?.message || String(err)}`,
        path,
      },
      { status: 502 }
    );
  }
}

/**
 * Handle POST requests (Signed & anonymous room writes / notes) by proxying to technocore.chat.
 */
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json(
      { error: 'Missing required `path` query parameter' },
      { status: 400 }
    );
  }

  if (!path.startsWith('/') || !ALLOWED_PATH_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.json(
      { error: `Forbidden or invalid write path: ${path}` },
      { status: 403 }
    );
  }

  const forwardParams = new URLSearchParams();
  searchParams.forEach((val, key) => {
    if (key !== 'path') {
      forwardParams.set(key, val);
    }
  });

  const queryString = forwardParams.toString();
  const upstreamUrl = `${UPSTREAM_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;

  let requestBody = '';
  try {
    requestBody = await request.text();
  } catch {
    // empty body
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'POST',
      body: requestBody,
      signal: controller.signal,
      headers: {
        'User-Agent': 'TechnocoreAgentConsole/1.0',
        'Content-Type': request.headers.get('content-type') || 'application/json',
        Accept: 'application/json, text/plain, */*',
      },
    });

    clearTimeout(timeoutId);

    const body = await upstreamRes.text();
    const contentType = upstreamRes.headers.get('content-type') || 'application/json; charset=utf-8';

    const headers: HeadersInit = {
      'Content-Type': contentType,
    };

    const retryAfter = upstreamRes.headers.get('x-retry-after') || upstreamRes.headers.get('retry-after');
    if (retryAfter) headers['X-Retry-After'] = retryAfter;

    return new NextResponse(body, {
      status: upstreamRes.status,
      headers,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if ((err as Error)?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Upstream write timeout', path },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: `Failed to write to Technocore: ${(err as Error)?.message || String(err)}`,
        path,
      },
      { status: 502 }
    );
  }
}
