import Link from "next/link";
import { TagList } from "@/components/Tag";
import { book } from "@/lib/data";

export const metadata = { title: "News" };

/** The filter is a URL, not component state: a filtered reading list is worth
 *  linking to and worth going back to. */
export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ conviction?: string }>;
}) {
  const { conviction } = await searchParams;
  const active = book.convictions.some((c) => c.id === conviction) ? conviction : undefined;
  const items = active ? book.news.filter((a) => a.convictions.includes(active)) : book.news;

  return (
    <section className="pane">
      <header>
        <h2>Reading list</h2>
        <span className="hint">past 7 days · bylines and correction policies only</span>
      </header>

      <div className="pad">
        <nav className="filters" aria-label="Filter by conviction">
          <Link href="/news" aria-current={active ? undefined : "page"}>
            Everything
          </Link>
          {book.convictions.map((c) => (
            <Link
              key={c.id}
              href={`/news?conviction=${c.id}`}
              aria-current={active === c.id ? "page" : undefined}
            >
              {c.short}
            </Link>
          ))}
        </nav>
      </div>

      {items.length === 0 ? (
        <div className="art">
          <p className="fine">Nothing this week touches that conviction.</p>
        </div>
      ) : (
        items.map((a) => (
          <article className="art" key={a.url + a.title}>
            <div className="src">
              <span>{a.source}</span>
              <span>{a.when}</span>
              <span>{a.readingTime}</span>
              {a.deepDive && <span>deep dive</span>}
            </div>
            <h3>
              <a href={a.url} target="_blank" rel="noopener noreferrer">
                {a.title}
              </a>
            </h3>
            <p className="why">{a.why}</p>
            <TagList ids={a.convictions} wrap />
          </article>
        ))
      )}
    </section>
  );
}
