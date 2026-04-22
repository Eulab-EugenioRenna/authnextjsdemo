import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createAuthTokens, revokeUserSessions, setAuthCookies } from "@/lib/session"
import { readUsers } from "@/lib/users"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "")

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e password obbligatorie" },
        { status: 400 }
      )
    }

    const users = await readUsers()
    const user = users.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: "Credenziali non valide" },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: "Credenziali non valide" },
        { status: 401 }
      )
    }

    await revokeUserSessions(user.email)

    const response = NextResponse.json({
      success: true,
      message: "Login effettuato",
      user: { email: user.email },
    })

    setAuthCookies(response, await createAuthTokens({ email: user.email }))

    return response
  } catch {
    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500 }
    )
  }
}
