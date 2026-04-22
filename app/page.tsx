import LoginForm from "./login-form"

type HomePageProps = {
  searchParams: Promise<{
    registered?: string
  }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams

  return <LoginForm registered={params.registered === "1"} />
}
