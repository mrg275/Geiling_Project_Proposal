import ConvictionsView from "@/components/convictions/ConvictionsView";
import { book } from "@/lib/data";

export const metadata = { title: "Convictions" };

/** The index shows the exposure map with the largest conviction already open,
 *  because arriving at a list of five titles and nothing else is a wasted
 *  screen. Each one also has its own URL under /convictions/[id]. */
export default function ConvictionsPage() {
  return <ConvictionsView conviction={book.convictions[0]} />;
}
