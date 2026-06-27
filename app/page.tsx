"use client"

import { useEffect, useState } from "react"
import { AuthScreen } from "@/components/AuthScreen"
import { Central } from "@/components/Central"
import { authMe, authLogout } from "@/lib/api"
import { SpinnerIcon } from "@/components/icons"
import type { Profile } from "@/lib/storage"

type Stage = "loading" | "auth" | "central"

export default function Page() {
  const [stage, setStage] = useState<Stage>("loading")
  const [apiKey, setApiKey] = useState("")
  const [profile, setProfile] = useState<Profile | null>(null)

  const loadSession = async () => {
    const acc = await authMe()
    if (acc) {
      setApiKey(acc.apiKey)
      setProfile({ name: acc.name, email: acc.email, phone: acc.phone })
      setStage("central")
    } else {
      setStage("auth")
    }
  }

  useEffect(() => {
    loadSession()
  }, [])

  const handleLogout = async () => {
    await authLogout()
    setApiKey("")
    setProfile(null)
    setStage("auth")
  }

  if (stage === "loading") {
    return (
      <div className="center">
        <SpinnerIcon size={28} className="spin" />
        <style jsx>{`
          :global(.spin) {
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  if (stage === "auth") {
    return <AuthScreen onAuthed={loadSession} />
  }

  return <Central apiKey={apiKey} profile={profile as Profile} onLogout={handleLogout} />
}
