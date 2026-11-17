"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, sectionOf } from "@/lib/nav";

/** Everything that is not finished, behind glass.
 *
 *  The four unfinished sections are laid out and populated, which is the point
 *  of a prototype — but a reader cannot tell a finished section from a sketch
 *  by looking, and the sketches are the ones made of invented numbers. So they
 *  render blurred under a card that names what the section will be and what it
 *  is waiting on, and the rail marks them before you click.
 *
 *  Which sections those are comes from `lib/nav.ts`, the same definition the
 *  rail and the command palette read, so the two can never disagree.
 *
 *  The blurred layer is `inert` and `aria-hidden`: it is a texture, not
 *  content, so it takes no focus and a screen reader never reads it. What it
 *  reads instead is the card.
 */
export default function SectionGate({ children }: { children: React.ReactNode }) {
  // A path that belongs to no section is not an unfinished section: it is the
  // 404 page, which is finished content and must stay sharp, readable and
  // clickable — blurring it left a mistyped URL with no way out.
  const section = sectionOf(usePathname());
  if (!section || section.ready) return <>{children}</>;

  const live = NAV.filter((item) => item.ready);

  return (
    <div className="soon">
      <div className="soon-body" aria-hidden="true" inert>
        {children}
      </div>

      <div className="soon-card">
        <span className="pill">Coming soon</span>
        <h2>{section.label}</h2>
        <p className="sub">{section.soon}</p>
        <p className="fine">
          The layout behind this card is real and the numbers in it are not.{" "}
          {live.length > 0 && (
            <>
              Finished and live:{" "}
              {live.map((item, i) => (
                <span key={item.href}>
                  {i > 0 && ", "}
                  <Link href={item.href}>{item.label}</Link>
                  {i === live.length - 1 ? "." : ""}
                </span>
              ))}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
