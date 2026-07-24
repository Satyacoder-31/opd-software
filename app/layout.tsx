import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "@/lib/fontawesome";
import "./globals.css";
import { SkipLink } from "@/components/ui/SkipLink";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Medyx — OPD EMR for Indian Clinics",
  description:
    "Queue management, patient records, consultations, prescriptions, and billing — the all-in-one OPD EMR built for small Indian clinics.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${ibmPlexSans.variable} font-sans`}
    >
      <body>
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
