import { notFound } from "next/navigation";
import ConvictionsView from "@/components/convictions/ConvictionsView";
import { book } from "@/lib/data";

export function generateStaticParams() {
  return book.convictions.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conviction = book.convictions.find((c) => c.id === id);
  return { title: conviction ? conviction.short : "Convictions" };
}

export default async function ConvictionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conviction = book.convictions.find((c) => c.id === id);
  if (!conviction) notFound();
  return <ConvictionsView conviction={conviction} />;
}
