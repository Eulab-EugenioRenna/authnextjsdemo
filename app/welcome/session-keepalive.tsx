"use client"

import { useEffect } from "react"

const REFRESH_INTERVAL_MS = 1000 * 60 * 3

export default function SessionKeepAlive() {
  useEffect(() => {
    let active = true

    async function refreshSession() {
      if (!active || document.visibilityState !== "visible") {
        return
      }

      try {
        await fetch("/api/refresh", {
          method: "POST",
          credentials: "same-origin",
        })
      } catch {
        return
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshSession()
      }
    }

    const intervalId = window.setInterval(() => {
      void refreshSession()
    }, REFRESH_INTERVAL_MS)

    document.addEventListener("visibilitychange", handleVisibilityChange)
    void refreshSession()

    return () => {
      active = false
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return null
}
