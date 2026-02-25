"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface ProfileStatus {
  isComplete: boolean
  completionStep: number
  isLoading: boolean
}

export function useProfileCheck() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>({
    isComplete: false,
    completionStep: 1,
    isLoading: true
  })

  useEffect(() => {
    if (status === "loading") return

    if (!session?.user) {
      setProfileStatus(prev => ({ ...prev, isLoading: false }))
      return
    }

    checkProfile()
  }, [session, status])

  const checkProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfileStatus({
          isComplete: data.profile?.isComplete || false,
          completionStep: data.profile?.completionStep || 1,
          isLoading: false
        })
      } else {
        setProfileStatus({
          isComplete: false,
          completionStep: 1,
          isLoading: false
        })
      }
    } catch (error) {
      console.error("Error checking profile:", error)
      setProfileStatus({
        isComplete: false,
        completionStep: 1,
        isLoading: false
      })
    }
  }

  const redirectToProfileIfIncomplete = () => {
    if (!profileStatus.isLoading && !profileStatus.isComplete) {
      router.push("/profile")
      return true
    }
    return false
  }

  const redirectToDashboardIfComplete = () => {
    if (!profileStatus.isLoading && profileStatus.isComplete) {
      router.push("/dashboard")
      return true
    }
    return false
  }

  return {
    ...profileStatus,
    checkProfile,
    redirectToProfileIfIncomplete,
    redirectToDashboardIfComplete
  }
}
