import { keyClass } from "@/lib/keys";
import { convictionName } from "@/lib/portfolio";
import type { ConvictionId } from "@/lib/types";

/** A conviction, named, with its colour slot as a dot. The name is always
 *  present, so the dot never has to carry the meaning on its own. */
export function Tag({ id }: { id: ConvictionId }) {
  return (
    <span className={`tag ${keyClass(id)}`}>
      <i />
      {convictionName(id)}
    </span>
  );
}

export function NoTag({ label = "No conviction" }: { label?: string }) {
  return (
    <span className="tag none">
      <i />
      {label}
    </span>
  );
}

/** A position's convictions, or the explicit absence of one. */
export function TagList({
  ids,
  emptyLabel,
  wrap = false,
}: {
  ids: ConvictionId[];
  emptyLabel?: string;
  wrap?: boolean;
}) {
  const content =
    ids.length === 0 ? (
      <NoTag label={emptyLabel} />
    ) : (
      ids.map((id) => <Tag key={id} id={id} />)
    );
  return wrap ? <div className="tags">{content}</div> : <>{content}</>;
}
