import { NextRequest, NextResponse } from "next/server"
import {
  clearAuthCookies,
  getRefreshTokenCookieName,
  getSafeRedirectPath,
  rotateRefreshToken,
  setAuthCookies,
} from "@/lib/session"

export async function GET(request: NextRequest) {
  const redirectTo = getSafeRedirectPath(request.nextUrl.searchParams.get("redirect"))
  const refreshToken = request.cookies.get(getRefreshTokenCookieName())?.value

  if (!refreshToken) {
    const loginUrl = new URL("/", request.url)
    loginUrl.searchParams.set("redirect", redirectTo)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const tokens = await rotateRefreshToken(refreshToken)
    const destination = new URL(redirectTo, request.url)
    const response = NextResponse.redirect(destination)

    setAuthCookies(response, tokens)

    return response
  } catch {
    const loginUrl = new URL("/", request.url)
    loginUrl.searchParams.set("redirect", redirectTo)

    const response = NextResponse.redirect(loginUrl)
    clearAuthCookies(response)

    return response
  }
}
