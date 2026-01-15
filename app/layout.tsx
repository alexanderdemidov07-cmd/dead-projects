import "./globals.css";
import SkullMark from "./components/SkullMark";
import FooterLyric from "./components/FooterLyric";
import { Space_Grotesk } from "next/font/google";

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={space.className}>
        <header className="dp-topbar">
          <div className="dp-topbar-inner">
            <a className="dp-brand" href="/">
              <span className="dp-mark">
                <SkullMark size={22} />
              </span>
              <span className="dp-brand-text">
                <span className="dp-brand-name">Dead Projects</span>
                <span className="dp-brand-tag">
                  unfinished work · honest responses
                </span>
              </span>
            </a>

            <nav className="dp-nav">
              <a className="dp-navlink" href="/new">
                + New
              </a>
            </nav>
          </div>
        </header>

        <div className="dp-shell">
          {children}

          <footer className="dp-footer">
            <div className="dp-footer-inner">
              <FooterLyric />
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
