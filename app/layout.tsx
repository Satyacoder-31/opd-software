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
  metadataBase: new URL("https://drorthos.in"),
  title: {
    default: "Dr Orthos — Advanced Orthopedic Care & Joint Health",
    template: "%s | Dr Orthos",
  },
  description:
    "Expert orthopedic care combining clinical precision, robotic joint replacement, arthroscopy, spine health, and seamless digital OPD appointments.",
  keywords: [
    "Dr Orthos",
    "Orthopedic Specialist",
    "Joint Replacement",
    "Knee Arthroscopy",
    "ACL Reconstruction",
    "Spine Surgery",
    "Fracture Treatment",
    "Sports Medicine",
    "OPD Appointment",
  ],
  authors: [{ name: "Dr Orthos Clinical Care Team" }],
  creator: "Dr Orthos",
  publisher: "Dr Orthos Healthcare",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Dr Orthos — Advanced Orthopedic Care. Designed Around You.",
    description:
      "Move Better. Live Stronger. Evidence-based orthopedic consultations, precision diagnostics, joint replacement, and dedicated recovery.",
    siteName: "Dr Orthos",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dr Orthos — Advanced Orthopedic Care",
    description:
      "Move Better. Live Stronger. Clinical excellence in joint replacement, arthroscopy, sports injuries, and spine health.",
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalClinic",
              name: "Dr Orthos Advanced Orthopedic Center",
              description:
                "Comprehensive orthopedic surgery, sports medicine, joint replacement, and musculoskeletal rehabilitation center.",
              medicalSpecialty: [
                "Orthopedic",
                "Musculoskeletal",
                "SportsMedicine",
                "Surgical",
              ],
              availableService: [
                {
                  "@type": "MedicalProcedure",
                  name: "Joint Replacement Surgery",
                },
                {
                  "@type": "MedicalProcedure",
                  name: "Arthroscopic Knee & Shoulder Reconstruction",
                },
                {
                  "@type": "MedicalProcedure",
                  name: "Non-Surgical Spine Decompression",
                },
                {
                  "@type": "MedicalProcedure",
                  name: "Fracture Reduction and Internal Fixation",
                },
              ],
            }),
          }}
        />
      </head>
      <body>
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
