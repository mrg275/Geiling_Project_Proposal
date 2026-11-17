import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans } from "next/font/google";
import Link from "next/link";
import Nav from "@/components/Nav";
import SectionGate from "@/components/SectionGate";
import TopBar from "@/components/TopBar";
import { book } from "@/lib/data";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Conviction — personal investing interface",
    template: "%s · Conviction",
  },
  description:
    "A portfolio read against the convictions behind it: exposure per idea, correlation inside a sleeve, and the arguments still moving each holding.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Runs before first paint so the page never flashes the wrong theme.
 *  Dark unless the viewer has chosen light here before. */
const themeInit = `try{var t=localStorage.getItem("conviction-theme");
document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}
catch(e){document.documentElement.setAttribute("data-theme","dark")}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <div className="app">
          <aside className="rail">
            <Link className="brand" href="/">
              <b>Conviction</b>
              <span>Personal investing</span>
            </Link>
            <Nav />
          </aside>
          <div className="main">
            <TopBar />
            <div id="main">
              <SectionGate>{children}</SectionGate>
            </div>
            <p className="foot">
              Sample data unless a line on the page says otherwise — the securities pages name
              their source under every figure. Chase connected, as of {book.asOf}. Article and
              research links point at publication home pages, not at the invented stories.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
