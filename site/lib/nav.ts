/** The five sections. One definition, used by the rail, the page title and the
 *  command palette, so a new section cannot appear in one and not the others. */

export interface NavItem {
  href: string;
  label: string;
  /** Number key that jumps here. */
  key: string;
  /** 16×16 icon path. */
  icon: string;
  /** False while the section is still a sketch: the rail marks it and the page
   *  renders behind a coming-soon card. One flag, so the rail and the page can
   *  never disagree about what works. */
  ready?: boolean;
  /** What the section will be, and what it is waiting on. */
  soon?: string;
}

export const NAV: NavItem[] = [
  {
    href: "/securities",
    label: "Securities",
    key: "1",
    ready: true,
    icon: "M7 2a5 5 0 1 1-3.5 8.5l-2 2L.4 11.4l2-2A5 5 0 0 1 7 2zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
  },
  {
    href: "/",
    label: "Portfolio",
    key: "2",
    icon: "M3 13h3v-3H3v3zm0-5h3V3H3v5zm5 5h5V8H8v5zm0-7h5V3H8v3z",
    soon:
      "Positions, the day's P&L, exposure per conviction and the correlation inside a sleeve. It needs a brokerage connection: every figure behind it is still invented.",
  },
  {
    href: "/convictions",
    label: "Convictions",
    key: "3",
    icon: "M8 1.5 2 4.3v3.4c0 3.3 2.5 6 6 7.3 3.5-1.3 6-4 6-7.3V4.3L8 1.5zm0 2 4 1.9v2.3c0 2.4-1.7 4.4-4 5.5-2.3-1.1-4-3.1-4-5.5V5.4l4-1.9z",
    soon:
      "Each thesis written down, what sits behind it, and what would change your mind — scored against the positions that express it. Waiting on the brokerage connection.",
  },
  {
    href: "/news",
    label: "News",
    key: "4",
    icon: "M2 3h9v10H3.5A1.5 1.5 0 0 1 2 11.5V3zm10 2h2v6.5a1.5 1.5 0 0 1-1.5 1.5H12V5zM3.5 5h6v1.5h-6V5zm0 3h6v1h-6V8zm0 2.5h4v1h-4v-1z",
    soon:
      "Articles filtered by which conviction they bear on rather than by ticker, with the reason they matter stated. Needs a news source, and the convictions real first.",
  },
  {
    href: "/emerging",
    label: "Emerging tech",
    key: "5",
    icon: "M8 1.5a4.5 4.5 0 0 1 2.6 8.2v1.8H5.4V9.7A4.5 4.5 0 0 1 8 1.5zM5.4 12.5h5.2v1H5.4v-1zm.8 2h3.6L8.8 15.5H7.2L6.2 14.5z",
    soon:
      "Milestones that would change a thesis before they show up in a price. Needs its sources chosen and a cadence for reading them.",
  },
];

/** The root section, whatever order the rail is in. */
const ROOT = NAV.find((n) => n.href === "/") as NavItem;

/** The section a path is *inside*, or null if it is not inside one.
 *
 *  Two things a bare `startsWith` got wrong, both of which put the 404 page
 *  behind the coming-soon card with its recovery links inert:
 *
 *    - `/nope` has no section, and falling back to the root section claimed it
 *      was the Portfolio.
 *    - `/newsletter` is not in the News section. A prefix match needs a path
 *      boundary, not just a shared first eight characters.
 */
export function sectionOf(pathname: string): NavItem | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return ROOT;
  return (
    NAV.filter((n) => n.href !== "/" && (path === n.href || path.startsWith(`${n.href}/`))).sort(
      (a, b) => b.href.length - a.href.length,
    )[0] ?? null
  );
}

/** The section to title the page with. The top bar always needs a name, so an
 *  unmatched path reads as the root — which is right for a heading and wrong
 *  for the gate, hence the two functions. */
export function sectionFor(pathname: string): NavItem {
  return sectionOf(pathname) ?? ROOT;
}
