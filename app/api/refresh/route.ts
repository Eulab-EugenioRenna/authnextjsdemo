import { NextRequest, NextResponse } from "next/server"
import { clearAuthCookies, getRefreshTokenCookieName, rotateRefreshToken, setAuthCookies } from "@/lib/session"

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(getRefreshTokenCookieName())?.value

  if (!refreshToken) {
    const response = NextResponse.json({ error: "Refresh token mancante" }, { status: 401 })
    clearAuthCookies(response)
    return response
  }

  try {
    const tokens = await rotateRefreshToken(refreshToken)
    const response = NextResponse.json({ success: true })

    setAuthCookies(response, tokens)

    return response
  } catch {
    const response = NextResponse.json({ error: "Sessione scaduta" }, { status: 401 })
    clearAuthCookies(response)
    return response
  }
}
