import type { Metadata } from "next";
import "./styles/globals.css";
import "./styles/components.css";

export const metadata: Metadata = {
  title: "Broker Calculator - Vehicle Transport Price Estimator",
  description: "Professional vehicle transport cost calculator for accurate shipping estimates across the United States",
  keywords: "vehicle transport, car shipping calculator, auto transport quote, car delivery cost",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Jost:wght@600;700&family=Montserrat:wght@400;500;700&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}