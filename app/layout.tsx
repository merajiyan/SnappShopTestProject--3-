import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snapshop",
  description: "Curated everyday products with fast search, filters, and recommendations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
