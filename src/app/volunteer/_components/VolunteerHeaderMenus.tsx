"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type VolunteerHeaderMenusProps = {
  isSignedIn: boolean;
};

const NAV_ITEMS = [
  { label: "Volunteer", href: "/" },
  { label: "My Applications", href: "/volunteer/applications" },
  { label: "Profile", href: "/volunteer/profile" }
] as const;

export default function VolunteerHeaderMenus({ isSignedIn }: VolunteerHeaderMenusProps) {
  const pathname = usePathname();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!isSignedIn) {
      setUnreadNotifications(0);
      return;
    }

    let isMounted = true;

    const syncUnreadCount = async () => {
      try {
        const response = await fetch("/api/volunteer/notifications/unread-count", {
          cache: "no-store"
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { unreadCount?: number };
        if (!isMounted) {
          return;
        }

        setUnreadNotifications(Number(payload.unreadCount) || 0);
      } catch {
        if (!isMounted) {
          return;
        }

        setUnreadNotifications(0);
      }
    };

    void syncUnreadCount();

    const interval = window.setInterval(() => {
      void syncUnreadCount();
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [isSignedIn, pathname]);

  if (!isSignedIn) {
    return (
      <Link href="/login" className="primary-action rounded-full px-4 py-2 text-sm font-semibold">
        Log in
      </Link>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "w-[10.5rem] rounded-full px-4 py-2 text-sm font-semibold transition whitespace-nowrap text-center",
              isActive
                ? "primary-action ring-2 ring-offset-1 ring-slate-900"
                : "stamp-pill"
            )}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <span>{item.label}</span>
              {item.href === "/volunteer/applications" && unreadNotifications > 0 ? (
                <>
                  <span
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-700 px-1.5 text-[11px] font-bold leading-none text-white"
                    aria-hidden="true"
                  >
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                  <span className="sr-only">{unreadNotifications} unread application updates</span>
                </>
              ) : null}
            </span>
          </Link>
        );
      })}
      <p className="sr-only" aria-live="polite">
        {unreadNotifications > 0
          ? `You have ${unreadNotifications} unread application updates.`
          : "No unread application updates."}
      </p>
    </div>
  );
}
