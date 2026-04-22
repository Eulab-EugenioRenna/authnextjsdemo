import Link from "next/link"
import { redirect } from "next/navigation"
import LogoutButton from "./logout-button"
import SessionKeepAlive from "./session-keepalive"
import { Button } from "@/components/ui/button"
import { getSession, hasRefreshToken } from "@/lib/session"

export default async function WelcomePage() {
  const session = await getSession()

  if (!session) {
    if (await hasRefreshToken()) {
      redirect(`/auth/refresh?redirect=${encodeURIComponent("/welcome")}`)
    }

    redirect(`/?redirect=${encodeURIComponent("/welcome")}`)
  }

  return (
    <main className="flex h-full w-full items-center justify-center px-4">
      <SessionKeepAlive />
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Login success</p>
        <h1 className="mt-3 text-3xl font-bold">Benvenuto</h1>
        <p className="mt-3 text-muted-foreground">
          {`Hai effettuato l'accesso con ${session.email}.`}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
          <LogoutButton />
        </div>
      </section>
    </main>
  )
}
