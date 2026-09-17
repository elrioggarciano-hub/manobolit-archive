import type { Metadata } from "next"
import "./globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import PersistentAudioPlayer from "@/components/PersistentAudioPlayer"
import ClickRipple from "@/components/ClickRipple"
import { AudioProvider } from "@/lib/context/AudioContext"

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
                var theme = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <AudioProvider>
          <ClickRipple />
          <Header />
          {children}
          <Footer />
          <PersistentAudioPlayer />
        </AudioProvider>
      </body>
    </html>
  )
}
