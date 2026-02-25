import { auth } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  GraduationCap,
  Users,
  TrendingUp,
  Shield,
  Briefcase,
  Building2,
  ArrowRight,
  Star,
} from "lucide-react"
import Link from "next/link"

const stats = [
  { label: "Students Placed", value: "500+", icon: Users },
  { label: "Partner Companies", value: "50+", icon: Building2 },
  { label: "Active Jobs", value: "25+", icon: Briefcase },
  { label: "Success Rate", value: "95%", icon: TrendingUp },
]

const features = [
  {
    icon: Users,
    title: "Complete Profile Setup",
    description: "Build your professional profile with academic details, skills, and achievements in a guided step-by-step process.",
  },
  {
    icon: Shield,
    title: "KYC Verification",
    description: "Secure identity verification ensures only verified students access placement opportunities.",
  },
  {
    icon: Briefcase,
    title: "Job Discovery",
    description: "Browse and apply to curated job opportunities from top companies visiting the campus.",
  },
  {
    icon: TrendingUp,
    title: "Track Applications",
    description: "Monitor your application status in real-time from submission to final selection.",
  },
]

const steps = [
  { step: "01", title: "Sign Up", description: "Create your account with college email" },
  { step: "02", title: "Complete Profile", description: "Fill in your academic and personal details" },
  { step: "03", title: "Get Verified", description: "Submit documents for KYC verification" },
  { step: "04", title: "Apply to Jobs", description: "Explore opportunities and apply" },
]

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    if (session.user.role === "ADMIN") {
      redirect("/admin/dashboard")
    } else {
      redirect("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">CampusConnect</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button size="sm">
                  Log in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="container relative mx-auto px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6">
              <Star className="mr-1 h-3 w-3" />
              Trusted by 500+ students
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your Gateway to
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Career Success
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              The official placement portal of SDMCET. Connect with top companies,
              track your applications, and launch your career journey with confidence.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A complete platform designed to streamline your placement journey
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="relative overflow-hidden border-2 transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in four simple steps
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.step} className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-border lg:block" />
                )}
                <div className="relative flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                    {step.step}
                  </div>
                  <h3 className="mt-6 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-2xl bg-primary p-8 text-center sm:p-12 lg:p-16">
            <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl lg:text-4xl">
              Ready to Start Your Career Journey?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Join hundreds of students who have found their dream jobs through CampusConnect.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">CampusConnect</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SDMCET. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
