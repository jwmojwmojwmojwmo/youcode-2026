import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Fraunces } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display"
});

const bodyFont = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "The Volunteer Hub",
  description: "The Volunteer Hub connects volunteers and organizations through event discovery, applications, and verified service tracking",
  icons: {
    icon: [{ url: "/logo.png?v=20260405", type: "image/png" }],
    shortcut: [{ url: "/logo.png?v=20260405", type: "image/png" }],
    apple: [{ url: "/logo.png?v=20260405", type: "image/png" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`} suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var saved = window.localStorage.getItem("theme");
                  var mode = saved === "light" ? "light" : "dark";
                  if (mode === "dark") {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                  document.documentElement.dataset.theme = mode;
                } catch (e) {
                  document.documentElement.classList.add("dark");
                  document.documentElement.dataset.theme = "dark";
                }
              })();
            `
          }}
        />
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
