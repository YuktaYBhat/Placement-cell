import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Settings, Bell, Palette, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PushNotificationToggle } from "@/components/push-notification-button"
import ThemeToggle from "@/components/theme-toggle"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile?.isComplete) {
    redirect("/profile")
  }
  return (
    <main className="flex-1 bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Manage how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PushNotificationToggle />
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>
              Customize the look and feel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark mode
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Account & Security</CardTitle>
            </div>
            <CardDescription>
              Manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Account security settings coming soon.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
} 