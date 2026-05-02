import { RateLimiterMemory } from 'rate-limiter-flexible'
import { NextRequest, NextResponse } from 'next/server'

const rateLimiters = {
  auth: new RateLimiterMemory({ points: 5, duration: 60 }),
  api: new RateLimiterMemory({ points: 60, duration: 60 }),
  webhooks: new RateLimiterMemory({ points: 200, duration: 60 }),
}

type LimiterKey = keyof typeof rateLimiters

export async function rateLimit(req: NextRequest, limiter: LimiterKey = 'api') {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'

  try {
    await rateLimiters[limiter].consume(ip)
    return null
  } catch {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': '60' },
      }
    )
  }
}
