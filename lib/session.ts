import { cookies } from "next/headers"
import { jwtVerify, SignJWT } from "jose"
import {
  findRefreshToken,
  removeRefreshToken,
  removeUserRefreshTokens,
  storeRefreshToken,
} from "@/lib/refresh-tokens"

const ACCESS_TOKEN_COOKIE_NAME = "access_token"
const REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
const ACCESS_TOKEN_MAX_AGE = 60 * 5
const REFRESH_TOKEN_MAX_AGE = 60 * 5
const ACCESS_TOKEN_REFRESH_THRESHOLD = 60

type TokenType = "access" | "refresh"

export type SessionUser = {
  email: string
}

type TokenPayload = SessionUser & {
  jti: string
  type: TokenType
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET is not configured")
  }

  return new TextEncoder().encode(secret)
}

async function signToken(payload: TokenPayload, expiresIn: number) {
  return new SignJWT({
    email: payload.email,
    type: payload.type,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.email)
    .setJti(payload.jti)
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(getJwtSecret())
}

async function verifyToken(token: string, expectedType: TokenType) {
  const { payload } = await jwtVerify(token, getJwtSecret())

  if (payload.type !== expectedType || typeof payload.sub !== "string") {
    throw new Error("Invalid token type")
  }

  if (typeof payload.jti !== "string" || !payload.jti) {
    throw new Error("Missing token id")
  }

  if (typeof payload.exp !== "number") {
    throw new Error("Missing token expiration")
  }

  return {
    email: payload.sub,
    exp: payload.exp,
    jti: payload.jti,
    type: expectedType,
  }
}

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  }
}

export async function createAuthTokens(user: SessionUser) {
  const accessToken = await signToken(
    {
      email: user.email,
      jti: crypto.randomUUID(),
      type: "access",
    },
    ACCESS_TOKEN_MAX_AGE
  )

  const refreshJti = crypto.randomUUID()
  const refreshToken = await signToken(
    {
      email: user.email,
      jti: refreshJti,
      type: "refresh",
    },
    REFRESH_TOKEN_MAX_AGE
  )

  await storeRefreshToken({
    email: user.email,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000).toISOString(),
    jti: refreshJti,
  })

  return {
    accessToken,
    refreshToken,
  }
}

export async function rotateRefreshToken(refreshToken: string) {
  const payload = await verifyToken(refreshToken, "refresh")
  const storedToken = await findRefreshToken(payload.jti)

  if (!storedToken || storedToken.email !== payload.email) {
    throw new Error("Refresh token not found")
  }

  await removeRefreshToken(payload.jti)

  return createAuthTokens({ email: payload.email })
}

export async function revokeRefreshToken(refreshToken: string) {
  try {
    const payload = await verifyToken(refreshToken, "refresh")
    await removeRefreshToken(payload.jti)
  } catch {
    return
  }
}

export async function revokeUserSessions(email: string) {
  await removeUserRefreshTokens(email)
}

export async function getSession() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value

  if (!accessToken) {
    return null
  }

  try {
    const payload = await verifyToken(accessToken, "access")

    return {
      email: payload.email,
    }
  } catch {
    return null
  }
}

export async function hasRefreshToken() {
  const cookieStore = await cookies()

  return Boolean(cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value)
}

export function getSafeRedirectPath(pathname?: string | null) {
  if (!pathname || !pathname.startsWith("/")) {
    return "/welcome"
  }

  if (pathname.startsWith("//")) {
    return "/welcome"
  }

  return pathname
}

export async function shouldRefreshAccessToken(accessToken: string) {
  try {
    const payload = await verifyToken(accessToken, "access")
    const secondsUntilExpiry = payload.exp - Math.floor(Date.now() / 1000)

    return secondsUntilExpiry <= ACCESS_TOKEN_REFRESH_THRESHOLD
  } catch {
    return true
  }
}

export function clearAuthCookies(response: {
  cookies: {
    set: (options: {
      name: string
      value: string
      expires: Date
      httpOnly: boolean
      path: string
      sameSite: "lax"
      secure: boolean
    }) => void
  }
}) {
  for (const name of [ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME]) {
    response.cookies.set({
      name,
      value: "",
      expires: new Date(0),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  }
}

export function setAuthCookies(
  response: {
    cookies: {
      set: (options: {
        name: string
        value: string
        httpOnly: boolean
        maxAge: number
        path: string
        sameSite: "lax"
        secure: boolean
      }) => void
    }
  },
  tokens: {
    accessToken: string
    refreshToken: string
  }
) {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: tokens.accessToken,
    ...getCookieOptions(ACCESS_TOKEN_MAX_AGE),
  })

  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: tokens.refreshToken,
    ...getCookieOptions(REFRESH_TOKEN_MAX_AGE),
  })
}

export function getAccessTokenCookieName() {
  return ACCESS_TOKEN_COOKIE_NAME
}

export function getRefreshTokenCookieName() {
  return REFRESH_TOKEN_COOKIE_NAME
}
