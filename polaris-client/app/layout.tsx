import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polaris Client",
  description: "Polaris communication client",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={"antialiased"}>{children}</body>
    </html>
  );
}
