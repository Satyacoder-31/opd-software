import type { Metadata } from "next";
import { Roboto, Roboto_Serif } from "next/font/google";
import "@/lib/fontawesome";
import "./globals.css";
import { SkipLink } from "@/components/ui/SkipLink";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["400", "500", "600", "700"],
});

const robotoSerif = Roboto_Serif({
  subsets: ["latin"],
  variable: "--font-roboto-serif",
  weight: ["500", "600", "700"],
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
      className={`${roboto.variable} ${robotoSerif.variable} font-sans`}
    >
      <body>
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
