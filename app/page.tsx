"use client"

import { useEffect, useState } from "react"
import { LoginScreen } from "@/components/LoginScreen"
import { Onboarding } from "@/components/Onboarding"
import { Central } from "@/components/Central"
import { storage, type Profile } from "@/lib/storage"
import { saveClient } from "@/lib/api"

type Stage = "loading" | "login" | "onboarding" | "central"

export default function Page() {
  const [stage, setStage] = useState<Stage>("loading")
  const [apiKey, setApiKey] = useState<string>("")
  const [profile, setProfile] = useState<Profile | null>(null)

  // Restaura sessão do localStorage só no cliente (evita mismatch de hidratação).
  useEffect(() => {
    const savedKey = storage.getApiKey()
    const savedProfile = storage.getProfile()

    if (!savedKey) {
      setStage("login")
      return
    }

    setApiKey(savedKey)
    if (savedProfile) {
      setProfile(savedProfile)
      setStage("central")
    } else {
      setStage("onboarding")
    }
  }, [])

  const handleLogin = (key: string) => {
    storage.setApiKey(key)
    setApiKey(key)
    const savedProfile = storage.getProfile()
    if (savedProfile) {
      setProfile(savedProfile)
      setStage("central")
    } else {
      setStage("onboarding")
    }
  }

  const handleOnboardingDone = (data: Profile) => {
    storage.setProfile(data)
    setProfile(data)
    setStage("central")
    // Persiste o cliente no banco (não bloqueia o fluxo).
    void saveClient(data)
  }

  const handleLogout = () => {
    storage.clearApiKey()
    setApiKey("")
    setStage("login")
  }

  if (stage === "loading") {
    return <div className="center" />
  }

  if (stage === "login") {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (stage === "onboarding") {
    return <Onboarding onComplete={handleOnboardingDone} />
  }

  return <Central apiKey={apiKey} profile={profile as Profile} onLogout={handleLogout} />
}
