"use client";

import Link from "next/link";
import { useState } from "react";
import { faBars, faXmark, faCalendarCheck, faUserDoctor } from "@fortawesome/free-solid-svg-icons";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";

const navLinks = [
  { href: "#treatments", label: "Treatments" },
  { href: "#conditions", label: "Conditions" },
  { href: "#doctors", label: "Specialists" },
  { href: "#journey", label: "Care Pathway" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0A192F]/95 backdrop-blur-md transition-all shadow-sm shadow-black/20">
      {/* Top Clinical Utility Bar */}
      <div className="border-b border-white/5 bg-[#071322] px-4 py-1.5 text-xs sm:text-[13px] text-slate-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5 text-sky-400 font-medium">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              OPD Hours: Mon–Sat 9:00 AM – 8:00 PM
            </span>
            <span className="hidden md:inline text-slate-400">
              Helpline: <strong className="text-white font-medium">+91 98765 43210</strong>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-slate-300 hover:text-sky-300 font-medium transition-colors"
            >
              Doctor &amp; Staff Login
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-10">
          <Link href="/" aria-label="Dr Orthos Home" className="shrink-0">
            <BrandLogo size="md" inverted priority />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[15px] sm:text-base font-medium text-slate-300 hover:text-white transition-colors duration-150 py-1 border-b-2 border-transparent hover:border-sky-400"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right Action Area */}
        <div className="flex items-center gap-3">
          <a
            href="#book"
            className="hidden md:inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2 text-sm sm:text-base font-semibold text-white shadow-md shadow-sky-600/30 hover:from-sky-400 hover:to-sky-500 transition-all active:scale-[0.98]"
          >
            <Icon icon={faCalendarCheck} className="size-4" />
            <span>Book Appointment</span>
          </a>

          {/* Outlined Prominent Login Button at Top Right Corner */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border-2 border-white/90 px-4 py-2 text-base font-bold text-white hover:bg-white hover:text-slate-950 transition-all shadow-md active:scale-95"
            title="Doctor & Staff Login"
          >
            Login
          </Link>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
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

      {/* Mobile Drawer */}
      {open && (
        <nav
          id="mobile-nav-menu"
          aria-label="Mobile Navigation"
          className="border-t border-slate-800 bg-[#071322] px-4 py-5 lg:hidden animate-in slide-in-from-top-2 duration-200"
        >
          <ul className="flex flex-col gap-1.5">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-lg px-3.5 py-2.5 text-base font-medium text-slate-200 hover:bg-slate-800/80 hover:text-sky-400"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="mt-2 pt-2 border-t border-slate-800">
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-base font-semibold text-white bg-white/10 hover:bg-white hover:text-slate-900 transition-colors"
                onClick={() => setOpen(false)}
              >
                <Icon icon={faUserDoctor} className="size-4 text-sky-400" />
                Doctor &amp; Staff Login
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
