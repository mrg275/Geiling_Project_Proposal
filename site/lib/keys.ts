/** Conviction colour slots.
 *
 *  Three hues, assigned in the order the convictions are listed and never
 *  recycled: the fourth conviction onward takes the neutral key, and the slice
 *  of the book behind no conviction at all is drawn as a hatch rather than as a
 *  fourth colour.
 *
 *  Why three: blue, terracotta and teal are the only set that clears
 *  colour-blind separation, the normal-vision floor and 3:1 contrast against
 *  both surfaces when every pair can appear side by side, which is what a
 *  stacked exposure bar does. Adding a fourth hue fails those gates, so beyond
 *  three the legend does the work instead. The slot follows the conviction, not
 *  its current size, so a position moving does not repaint the chart.
 */
import { book } from "./data";
import type { ConvictionId } from "./types";

export type KeyClass = "k1" | "k2" | "k3" | "k0";

const SLOTS: KeyClass[] = ["k1", "k2", "k3"];

export function keyClass(id: ConvictionId): KeyClass {
  const i = book.convictions.findIndex((c) => c.id === id);
  return i >= 0 && i < SLOTS.length ? SLOTS[i] : "k0";
}

/** The CSS variable behind a slot, for inline fills. */
export const keyVar = (id: ConvictionId) => `var(--${keyClass(id)})`;

/** Neutral hatch, used for the part of the book held against nothing. */
export const HATCH =
  "repeating-linear-gradient(45deg, var(--k0) 0 4px, var(--surf3) 4px 8px)";
