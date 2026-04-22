import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { clearAuthCookies, getRefreshTokenCookieName, revokeRefreshToken } from "@/lib/session"

export async function POST() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(getRefreshTokenCookieName())?.value

  if (refreshToken) {
    await revokeRefreshToken(refreshToken)
  }

  const response = NextResponse.json({
    success: true,
    message: "Logout effettuato",
  })

  clearAuthCookies(response)

  return response
}
