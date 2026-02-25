"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { IconBell, IconBellOff } from "@tabler/icons-react"
import { LoadingSpinner } from "@/components/ui/loading"
import { toast } from "sonner"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray as Uint8Array<ArrayBuffer>
}

export function PushNotificationButton() {
    const [isSupported, setIsSupported] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

    useEffect(() => {
        // Check if push notifications are supported
        if ("serviceWorker" in navigator && "PushManager" in window) {
            setIsSupported(true)
            registerServiceWorker()
        } else {
            setIsLoading(false)
        }
    }, [])

    const registerServiceWorker = async () => {
        try {
            const reg = await navigator.serviceWorker.register("/sw.js")
            setRegistration(reg)

            // Check if already subscribed
            const subscription = await reg.pushManager.getSubscription()
            setIsSubscribed(!!subscription)
        } catch (error) {
            console.error("Service Worker registration failed:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const subscribe = async () => {
        if (!registration || !VAPID_PUBLIC_KEY) {
            toast.error("Push notifications are not configured")
            return
        }

        setIsLoading(true)

        try {
            // Request notification permission
            const permission = await Notification.requestPermission()
            if (permission !== "granted") {
                toast.error("Notification permission denied")
                setIsLoading(false)
                return
            }

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            })

            // Send subscription to server
            const response = await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription: subscription.toJSON() })
            })

            if (response.ok) {
                setIsSubscribed(true)
                toast.success("Push notifications enabled!")
            } else {
                throw new Error("Failed to save subscription")
            }
        } catch (error) {
            console.error("Failed to subscribe:", error)
            toast.error("Failed to enable notifications")
        } finally {
            setIsLoading(false)
        }
    }

    const unsubscribe = async () => {
        if (!registration) return

        setIsLoading(true)

        try {
            const subscription = await registration.pushManager.getSubscription()
            if (subscription) {
                await subscription.unsubscribe()

                // Remove from server
                await fetch("/api/push/subscribe", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                })

                setIsSubscribed(false)
                toast.success("Push notifications disabled")
            }
        } catch (error) {
            console.error("Failed to unsubscribe:", error)
            toast.error("Failed to disable notifications")
        } finally {
            setIsLoading(false)
        }
    }

    if (!isSupported) {
        return null
    }

    return (
        <Button
            variant={isSubscribed ? "outline" : "default"}
            size="sm"
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={isLoading}
        >
            {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
            ) : isSubscribed ? (
                <IconBellOff className="w-4 h-4 mr-2" />
            ) : (
                <IconBell className="w-4 h-4 mr-2" />
            )}
            {isLoading ? "Loading..." : isSubscribed ? "Disable Notifications" : "Enable Notifications"}
        </Button>
    )
}

// Simpler toggle version for settings
export function PushNotificationToggle() {
    const [isSupported, setIsSupported] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

    useEffect(() => {
        if ("serviceWorker" in navigator && "PushManager" in window) {
            setIsSupported(true)
            checkSubscription()
        } else {
            setIsLoading(false)
        }
    }, [])

    const checkSubscription = async () => {
        try {
            const reg = await navigator.serviceWorker.register("/sw.js")
            setRegistration(reg)
            const subscription = await reg.pushManager.getSubscription()
            setIsSubscribed(!!subscription)
        } catch (error) {
            console.error("Error checking subscription:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const toggleSubscription = async () => {
        if (!registration || !VAPID_PUBLIC_KEY) {
            toast.error("Push notifications are not configured")
            return
        }

        setIsLoading(true)

        try {
            if (isSubscribed) {
                const subscription = await registration.pushManager.getSubscription()
                if (subscription) {
                    await subscription.unsubscribe()
                    await fetch("/api/push/subscribe", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ endpoint: subscription.endpoint })
                    })
                }
                setIsSubscribed(false)
                toast.success("Notifications disabled")
            } else {
                const permission = await Notification.requestPermission()
                if (permission !== "granted") {
                    toast.error("Permission denied")
                    setIsLoading(false)
                    return
                }

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                })

                const response = await fetch("/api/push/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ subscription: subscription.toJSON() })
                })

                if (response.ok) {
                    setIsSubscribed(true)
                    toast.success("Notifications enabled!")
                }
            }
        } catch (error) {
            console.error("Toggle error:", error)
            toast.error("Failed to update notification settings")
        } finally {
            setIsLoading(false)
        }
    }

    if (!isSupported) {
        return (
            <div className="text-sm text-muted-foreground">
                Push notifications are not supported in your browser
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                    {isSubscribed
                        ? "You'll receive notifications for new jobs and deadlines"
                        : "Enable to receive instant updates"}
                </p>
            </div>
            <Button
                variant={isSubscribed ? "secondary" : "default"}
                size="sm"
                onClick={toggleSubscription}
                disabled={isLoading}
            >
                {isLoading ? (
                    <LoadingSpinner size="sm" />
                ) : isSubscribed ? (
                    "Enabled"
                ) : (
                    "Enable"
                )}
            </Button>
        </div>
    )
}
