import fs from "fs/promises"
import path from "path"

export type StoredUser = {
  email: string
  passwordHash: string
}

const filePath = path.join(process.cwd(), "data", "user.json")

export async function readUsers(): Promise<StoredUser[]> {
  try {
    const content = await fs.readFile(filePath, "utf8")
    return JSON.parse(content)
  } catch {
    return []
  }
}

export async function writeUsers(users: StoredUser[]) {
  await fs.writeFile(filePath, JSON.stringify(users, null, 2), "utf8")
}
