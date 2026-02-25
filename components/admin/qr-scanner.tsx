"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Camera, CameraOff, CheckCircle, XCircle, User, Building2 } from "lucide-react"

interface QRScannerProps {
    onScan: (data: string) => void
    isProcessing?: boolean
}

export function QRScanner({ onScan, isProcessing = false }: QRScannerProps) {
    const [isActive, setIsActive] = useState(false)
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            })
            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }

            setIsActive(true)
            setHasPermission(true)
            startScanning()
        } catch (error) {
            console.error("Camera error:", error)
            setHasPermission(false)
            toast.error("Could not access camera. Please grant camera permission.")
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
            scanIntervalRef.current = null
        }
        setIsActive(false)
    }

    const startScanning = () => {
        // Using a simple interval-based approach
        // In production, you might want to use a proper QR code library
        scanIntervalRef.current = setInterval(() => {
            if (videoRef.current && canvasRef.current) {
                const canvas = canvasRef.current
                const video = videoRef.current
                const context = canvas.getContext('2d')

                if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.height = video.videoHeight
                    canvas.width = video.videoWidth
                    context.drawImage(video, 0, 0, canvas.width, canvas.height)

                    // For demo purposes, we'll use a click-to-scan approach
                    // In production, integrate with a library like jsQR or html5-qrcode
                }
            }
        }, 100)
    }

    // Manual input for demo purposes
    const [manualInput, setManualInput] = useState("")

    const handleManualSubmit = () => {
        if (manualInput.trim()) {
            onScan(manualInput.trim())
            setManualInput("")
        }
    }

    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [])

    return (
        <div className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {isActive ? (
                    <>
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-64 h-64 border-2 border-white/50 rounded-lg">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl" />
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr" />
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl" />
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br" />
                            </div>
                        </div>
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                        <Camera className="w-16 h-16 mb-4" />
                        <p>Camera is off</p>
                    </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex gap-2">
                {isActive ? (
                    <Button onClick={stopCamera} variant="destructive" className="flex-1">
                        <CameraOff className="w-4 h-4 mr-2" />
                        Stop Camera
                    </Button>
                ) : (
                    <Button onClick={startCamera} className="flex-1">
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                    </Button>
                )}
            </div>

            {/* Manual Input (for testing without camera) */}
            <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Manual Entry (for testing):</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 px-3 py-2 border rounded-md"
                        placeholder="Paste application ID or QR data..."
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                    />
                    <Button onClick={handleManualSubmit} disabled={isProcessing || !manualInput.trim()}>
                        Submit
                    </Button>
                </div>
            </div>
        </div>
    )
}
