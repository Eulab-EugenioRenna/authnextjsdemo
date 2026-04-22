import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { readUsers, writeUsers } from "@/lib/users"

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

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La password deve avere almeno 8 caratteri" },
        { status: 400 }
      )
    }

    const users = await readUsers()
    const existingUser = users.find((u) => u.email === email)

    if (existingUser) {
      return NextResponse.json(
        { error: "Utente già presente" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    users.push({
      email,
      passwordHash,
    })

    await writeUsers(users)

    return NextResponse.json({
      success: true,
      message: "Utente registrato",
    })
  } catch {
    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500 }
    )
  }
}
