import fs from "fs/promises"
import path from "path"

export type StoredRefreshToken = {
  email: string
  expiresAt: string
  jti: string
}

const filePath = path.join(process.cwd(), "data", "refresh-tokens.json")

export async function readRefreshTokens(): Promise<StoredRefreshToken[]> {
  try {
    const content = await fs.readFile(filePath, "utf8")
    return JSON.parse(content)
  } catch {
    return []
  }
}

export async function writeRefreshTokens(tokens: StoredRefreshToken[]) {
  await fs.writeFile(filePath, JSON.stringify(tokens, null, 2), "utf8")
}

export async function storeRefreshToken(token: StoredRefreshToken) {
  const tokens = await readRefreshTokens()
  const nextTokens = tokens.filter((entry) => entry.jti !== token.jti)

  nextTokens.push(token)

  await writeRefreshTokens(nextTokens)
}

export async function removeRefreshToken(jti: string) {
  const tokens = await readRefreshTokens()
  await writeRefreshTokens(tokens.filter((entry) => entry.jti !== jti))
}

export async function removeUserRefreshTokens(email: string) {
  const tokens = await readRefreshTokens()
  await writeRefreshTokens(tokens.filter((entry) => entry.email !== email))
}

export async function findRefreshToken(jti: string) {
  const tokens = await readRefreshTokens()
  const now = Date.now()
  const validTokens = tokens.filter((entry) => new Date(entry.expiresAt).getTime() > now)

  if (validTokens.length !== tokens.length) {
    await writeRefreshTokens(validTokens)
  }

  return validTokens.find((entry) => entry.jti === jti) ?? null
}
