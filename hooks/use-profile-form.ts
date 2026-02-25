"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

interface UseProfileFormOptions {
    initialData?: any
    onSaveSuccess?: (data: any) => void
    onSaveError?: (error: Error) => void
    autoSaveDelay?: number // milliseconds
    enableLocalStorage?: boolean
    storageKey?: string
}

interface SaveState {
    status: SaveStatus
    lastSaved: Date | null
    error: Error | null
    retryCount: number
}

const MAX_RETRY_COUNT = 3
const RETRY_DELAY = 2000 // 2 seconds

export function useProfileForm(options: UseProfileFormOptions = {}) {
    const {
        initialData = {},
        onSaveSuccess,
        onSaveError,
        autoSaveDelay = 1500, // 1.5 seconds debounce
        enableLocalStorage = true,
        storageKey = "profile-form-draft"
    } = options

    const [formData, setFormData] = useState<any>(initialData)
    const [saveState, setSaveState] = useState<SaveState>({
        status: "idle",
        lastSaved: null,
        error: null,
        retryCount: 0
    })
    const [isDirty, setIsDirty] = useState(false)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    // Refs for debouncing
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const saveInProgressRef = useRef(false)
    const pendingSaveRef = useRef<any>(null)

    // Load draft from localStorage on mount
    useEffect(() => {
        if (enableLocalStorage && typeof window !== 'undefined') {
            try {
                const draft = localStorage.getItem(storageKey)
                if (draft) {
                    const parsedDraft = JSON.parse(draft)
                    // Only load draft if it's newer than initialData or initialData is empty
                    if (Object.keys(initialData).length === 0 || parsedDraft._timestamp > Date.now() - 24 * 60 * 60 * 1000) {
                        setFormData(parsedDraft)
                        setIsDirty(true)
                    }
                }
            } catch (error) {
                console.error("Failed to load draft from localStorage:", error)
            }
        }
    }, [enableLocalStorage, storageKey])

    // Save to localStorage whenever formData changes
    useEffect(() => {
        if (enableLocalStorage && isDirty && typeof window !== 'undefined') {
            try {
                const dataWithTimestamp = {
                    ...formData,
                    _timestamp: Date.now()
                }
                localStorage.setItem(storageKey, JSON.stringify(dataWithTimestamp))
            } catch (error) {
                console.error("Failed to save draft to localStorage:", error)
            }
        }
    }, [formData, isDirty, enableLocalStorage, storageKey])

    // Save to API
    const saveToApi = useCallback(async (data: any, isRetry = false): Promise<boolean> => {
        if (saveInProgressRef.current && !isRetry) {
            pendingSaveRef.current = data
            return false
        }

        saveInProgressRef.current = true
        setSaveState(prev => ({ ...prev, status: "saving", error: null }))

        try {
            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to save profile")
            }

            const result = await response.json()

            setSaveState({
                status: "saved",
                lastSaved: new Date(),
                error: null,
                retryCount: 0
            })

            setIsDirty(false)

            // Clear localStorage draft after successful save
            if (enableLocalStorage && typeof window !== 'undefined') {
                localStorage.removeItem(storageKey)
            }

            onSaveSuccess?.(result)

            // Show success toast only for manual saves or first auto-save
            if (!isRetry) {
                toast.success("Changes saved", {
                    duration: 2000,
                    position: "bottom-right"
                })
            }

            saveInProgressRef.current = false

            // If there's a pending save, execute it
            if (pendingSaveRef.current) {
                const pendingData = pendingSaveRef.current
                pendingSaveRef.current = null
                setTimeout(() => saveToApi(pendingData), 100)
            }

            return true
        } catch (error) {
            const err = error instanceof Error ? error : new Error("Unknown error")

            setSaveState(prev => ({
                status: "error",
                lastSaved: prev.lastSaved,
                error: err,
                retryCount: prev.retryCount + 1
            }))

            onSaveError?.(err)

            // Auto-retry logic
            if (saveState.retryCount < MAX_RETRY_COUNT && !isRetry) {
                toast.error(`Save failed. Retrying... (${saveState.retryCount + 1}/${MAX_RETRY_COUNT})`, {
                    duration: RETRY_DELAY,
                    position: "bottom-right"
                })

                setTimeout(() => {
                    saveToApi(data, true)
                }, RETRY_DELAY)
            } else {
                toast.error("Failed to save changes. Please try again.", {
                    duration: 4000,
                    position: "bottom-right",
                    action: {
                        label: "Retry",
                        onClick: () => saveToApi(data, true)
                    }
                })
            }

            saveInProgressRef.current = false
            return false
        }
    }, [saveState.retryCount, onSaveSuccess, onSaveError, enableLocalStorage, storageKey])

    // Debounced auto-save
    const scheduleAutoSave = useCallback((data: any) => {
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current)
        }

        autoSaveTimeoutRef.current = setTimeout(() => {
            saveToApi(data)
        }, autoSaveDelay)
    }, [autoSaveDelay, saveToApi])

    // Update field value with optimistic update
    const updateField = useCallback((field: string, value: any, autoSave = true) => {
        setFormData((prev: any) => {
            const newData = { ...prev, [field]: value }

            // Schedule auto-save if enabled
            if (autoSave) {
                scheduleAutoSave(newData)
            }

            return newData
        })

        setIsDirty(true)

        // Clear validation error for this field
        setValidationErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors[field]
            return newErrors
        })

        // Optimistic UI - show saving status immediately
        if (autoSave) {
            setSaveState(prev => ({ ...prev, status: "saving" }))
        }
    }, [scheduleAutoSave])

    // Batch update multiple fields
    const updateFields = useCallback((updates: Record<string, any>, autoSave = true) => {
        setFormData((prev: any) => {
            const newData = { ...prev, ...updates }

            if (autoSave) {
                scheduleAutoSave(newData)
            }

            return newData
        })

        setIsDirty(true)

        // Clear validation errors for updated fields
        setValidationErrors(prev => {
            const newErrors = { ...prev }
            Object.keys(updates).forEach(key => delete newErrors[key])
            return newErrors
        })

        if (autoSave) {
            setSaveState(prev => ({ ...prev, status: "saving" }))
        }
    }, [scheduleAutoSave])

    // Manual save (for "Save" button clicks)
    const saveManually = useCallback(async () => {
        // Cancel any pending auto-save
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current)
        }

        return await saveToApi(formData)
    }, [formData, saveToApi])

    // Save on blur (for input fields)
    const saveOnBlur = useCallback(() => {
        if (isDirty && formData) {
            // Cancel pending auto-save and save immediately
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }
            saveToApi(formData)
        }
    }, [isDirty, formData, saveToApi])

    // Field validation
    const validateField = useCallback((field: string, value: any, rules?: any) => {
        let error = ""

        if (rules?.required && (!value || value.toString().trim() === "")) {
            error = `${field} is required`
        }

        if (rules?.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = "Invalid email format"
        }

        if (rules?.minLength && value && value.length < rules.minLength) {
            error = `Minimum ${rules.minLength} characters required`
        }

        if (rules?.maxLength && value && value.length > rules.maxLength) {
            error = `Maximum ${rules.maxLength} characters allowed`
        }

        if (rules?.pattern && value && !rules.pattern.test(value)) {
            error = rules.patternMessage || "Invalid format"
        }

        if (error) {
            setValidationErrors(prev => ({ ...prev, [field]: error }))
            return false
        } else {
            setValidationErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
            return true
        }
    }, [])

    // Reset form
    const reset = useCallback(() => {
        setFormData(initialData)
        setIsDirty(false)
        setValidationErrors({})
        setSaveState({
            status: "idle",
            lastSaved: null,
            error: null,
            retryCount: 0
        })

        if (enableLocalStorage && typeof window !== 'undefined') {
            localStorage.removeItem(storageKey)
        }
    }, [initialData, enableLocalStorage, storageKey])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }
        }
    }, [])

    return {
        formData,
        setFormData,
        updateField,
        updateFields,
        saveManually,
        saveOnBlur,
        validateField,
        validationErrors,
        setValidationErrors,
        saveState,
        isDirty,
        reset
    }
}
