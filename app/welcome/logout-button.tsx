"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"

export default function LogoutButton() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  async function handleLogout() {
    setError("")

    const response = await fetch("/api/logout", {
      method: "POST",
    })

    if (!response.ok) {
      setError("Logout non riuscito")
      return
    }

    startTransition(() => {
      router.replace("/")
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <Button disabled={isPending} onClick={handleLogout} type="button" variant="destructive">
        Logout
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
