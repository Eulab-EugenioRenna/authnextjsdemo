import Link from "next/link"

type WelcomePageProps = {
  searchParams: Promise<{
    email?: string
  }>
}

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const { email } = await searchParams

  return (
    <main className="flex h-full w-full items-center justify-center px-4">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Login success</p>
        <h1 className="mt-3 text-3xl font-bold">Benvenuto</h1>
        <p className="mt-3 text-muted-foreground">
          {email ? `Hai effettuato l'accesso con ${email}.` : "Hai effettuato l'accesso correttamente."}
        </p>
        <div className="mt-6">
          <Link className="text-sm font-medium hover:underline" href="/">
            Torna al login
          </Link>
        </div>
      </section>
    </main>
  )
}
