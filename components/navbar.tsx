"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  IconLayoutDashboard,
  IconBriefcase,
  IconFileText,
} from "@tabler/icons-react";

import Logo from "@/components/navbar-components/logo";
import NotificationMenu from "@/components/navbar-components/notification-menu";
import UserMenu from "@/components/navbar-components/user-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: IconBriefcase },
  { href: "/applications", label: "Applications", icon: IconFileText },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container relative flex h-14 max-w-screen-2xl items-center px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-6">
          <Logo />
          <span className="font-semibold text-sm hidden sm:inline-block">
            CampusConnect
          </span>
        </Link>

        {/* Navigation */}
        <NavigationMenu className="hidden md:flex ml-auto mr-4">
          <NavigationMenuList className="gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
                        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side actions */}
        <div className="ml-2 flex items-center gap-2">
          {/* Notifications */}
          <NotificationMenu />

          {/* User Menu */}
          <UserMenu
            avatar={session?.user?.image || undefined}
            name={session?.user?.name || undefined}
            email={session?.user?.email || undefined}
          />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t">
        <nav className="container flex justify-around py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 text-xs rounded-md transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
