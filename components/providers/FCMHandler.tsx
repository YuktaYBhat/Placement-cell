"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { requestPermissionAndGetToken } from "@/lib/firebase";

export default function FCMHandler() {
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.user && "Notification" in window) {
            const initializeFCM = async () => {
                try {
                    const token = await requestPermissionAndGetToken();
                    if (token) {
                        await fetch("/api/save-fcm-token", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ token }),
                        });
                        console.log("FCM Token synced with backend");
                    }
                } catch (error) {
                    console.error("FCM Initialization error:", error);
                }
            };

            // Delay initialization slightly to ensure browser is ready
            const timeoutId = setTimeout(initializeFCM, 2000);
            return () => clearTimeout(timeoutId);
        }
    }, [session]);

    return null;
}
