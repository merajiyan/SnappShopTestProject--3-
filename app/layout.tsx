import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://snapshop.example"),
  title: {
    default: "Snapshop",
    template: "%s | Snapshop",
  },
  description:
    "Curated everyday products with fast search, filters, and recommendations.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Snapshop",
    description:
      "Discover curated products with smart search and recommendations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
