"use client";

import Link from "next/link";
import { useState } from "react";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "/clinics", label: "Find a clinic" },
  { href: "/portal", label: "Patient portal" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-surface-deep/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="Medyx home" className="shrink-0">
            <BrandLogo size="sm" inverted priority />
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-white/75 underline-offset-4 transition-[color,opacity] duration-150 hover:text-white hover:underline active:opacity-70"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-white/75 underline-offset-4 transition-[color,opacity] duration-150 hover:text-white hover:underline active:opacity-70"
                >
                  {link.label}
                </a>
              ),
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-white/85 underline-offset-4 transition-[color,opacity] duration-150 hover:text-white hover:underline active:opacity-70 sm:inline"
          >
            Sign in
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center text-white transition-opacity duration-150 hover:opacity-80 active:opacity-60"
            aria-expanded={open}
            aria-controls="mobile-nav-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <Icon icon={faXmark} className="size-5" aria-hidden />
            ) : (
              <Icon icon={faBars} className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav-menu"
          aria-label="Mobile"
          className="border-t border-white/10 bg-surface-deep px-4 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                {link.href.startsWith("/") ? (
                  <Link
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
            <li>
              <Link
                href="/login"
                className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
              >
                Clinic sign in
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
