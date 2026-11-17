"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, sectionFor } from "@/lib/nav";

export default function Nav() {
  const pathname = usePathname();
  const current = sectionFor(pathname).href;

  return (
    <nav className="nav" aria-label="Sections">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.href === current ? "page" : undefined}
        >
          <svg className="ic" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d={item.icon} />
          </svg>
          {item.label}
          {!item.ready && (
            <span className="navsoon" title="Not finished yet">
              soon
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
