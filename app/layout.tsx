import type { Metadata } from "next"
import "./globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import PersistentAudioPlayer from "@/components/PersistentAudioPlayer"
import ClickRipple from "@/components/ClickRipple"
import PageTransition from "@/components/PageTransition"
import { AudioProvider } from "@/lib/context/AudioContext"
import { ToastProvider } from "@/lib/context/ToastContext"
import { ThemeProvider } from "@/lib/context/ThemeContext"

export const metadata: Metadata = {
  title: "ManoboLit Archive",
  description: "A rule-based classification and retrieval system for Agusan Manobo oral literature and folk songs",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var stored = localStorage.getItem('theme');
                var theme = stored === 'light' || stored === 'dark'
                  ? stored
                  : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <ToastProvider>
            <AudioProvider>
              <ClickRipple />
              <Header />
              <PageTransition>{children}</PageTransition>
              <Footer />
              <PersistentAudioPlayer />
            </AudioProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
