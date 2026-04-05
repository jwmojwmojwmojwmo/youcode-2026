"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
