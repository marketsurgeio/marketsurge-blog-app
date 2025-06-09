import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ErrorBoundary } from "@/components/error-boundary";
import ToasterProvider from "@/components/ToasterProvider";

export const metadata: Metadata = {
  title: "Blog Forge - AI-Powered Blog Generator",
  description: "Generate high-quality blog posts with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <body className="antialiased">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <ToasterProvider />
        </body>
      </html>
    </ClerkProvider>
  );
}
