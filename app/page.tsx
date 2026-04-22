import { redirect } from "next/navigation"
import LoginForm from "./login-form"
import { getSafeRedirectPath, getSession, hasRefreshToken } from "@/lib/session"

type HomePageProps = {
  searchParams: Promise<{
    registered?: string
    redirect?: string
  }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const redirectTo = getSafeRedirectPath(params.redirect)
  const session = await getSession()

  if (session) {
    redirect(redirectTo)
  }

  if (await hasRefreshToken()) {
    redirect(`/auth/refresh?redirect=${encodeURIComponent(redirectTo)}`)
  }

  return <LoginForm redirectTo={redirectTo} registered={params.registered === "1"} />
}
