"use client";

import { usePathname } from "next/navigation";
import { sectionFor, sectionOf } from "@/lib/nav";
import CommandPalette from "./CommandPalette";
import ThemeToggle from "./ThemeToggle";

export default function TopBar() {
  const pathname = usePathname();

  return (
    <div className="bar">
      <h1 className="page">{sectionFor(pathname).label}</h1>
      <CommandPalette />
      {/* The finished section carries live prices, live filings and a computed
          market cap, so a chip calling the whole page sample was the one piece
          of chrome contradicting the figures under it. There, each figure names
          its own source instead. */}
      <span className="note">
        {sectionOf(pathname)?.ready ? "Sources named per figure" : "Sample data"}
      </span>
      <ThemeToggle />
    </div>
  );
}
