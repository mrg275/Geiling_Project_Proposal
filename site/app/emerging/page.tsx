import { TagList } from "@/components/Tag";
import { book } from "@/lib/data";

export const metadata = { title: "Emerging tech" };

export default function EmergingPage() {
  return (
    <section className="pane">
      <header>
        <h2>Emerging technology</h2>
        <span className="hint">week of 9–16 November 2026</span>
      </header>
      <div className="pad">
        <p className="sub">
          Milestones only. Funding rounds, keynotes and demo videos are not milestones.
        </p>
      </div>
      {book.emergingTech.map((item) => (
        <article className="art" key={item.title}>
          <div className="src">
            <span>{item.domain}</span>
            <span>{item.when}</span>
            <span>{item.source}</span>
          </div>
          <h3>{item.title}</h3>
          <p className="why">{item.why}</p>
          <TagList ids={item.convictions} emptyLabel="No conviction yet" wrap />
        </article>
      ))}
    </section>
  );
}
