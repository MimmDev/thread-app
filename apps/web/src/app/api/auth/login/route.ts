import { signIn } from '@/auth'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const callbackUrl = new URL(req.url).searchParams.get('callbackUrl') ?? '/dashboard'
  return signIn('auth0', { redirectTo: callbackUrl })
}
