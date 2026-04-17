import type { Metadata } from "next";
import { SharePlayer } from "./SharePlayer";

type PageProps = { params: Promise<{ id: string }> };

type Meta = {
  voice: string;
  voiceLabel: string;
  speed: number;
  textPreview: string;
  createdAt: string;
};

async function getShareData(id: string): Promise<{ audioUrl: string; meta: Meta } | null> {
  const base = process.env.NEXT_PUBLIC_BLOB_BASE_URL;
  if (!base) return null;
  const audioUrl = `${base}/s/${id}/audio.mp3`;
  try {
    const res = await fetch(`${base}/s/${id}/meta.json`, { cache: "no-store" });
    if (!res.ok) return null;
    const meta = (await res.json()) as Meta;
    return { audioUrl, meta };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getShareData(id);
  if (!data) return { title: "Shared clip not found · PHONO" };
  const preview = (data.meta.textPreview ?? "").slice(0, 140);
  return {
    title: `${data.meta.voiceLabel} speaks on PHONO`,
    description: preview,
    openGraph: {
      title: `${data.meta.voiceLabel} on PHONO`,
      description: preview,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.meta.voiceLabel} on PHONO`,
      description: preview,
      creator: "@0xEvinho",
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const data = await getShareData(id);

  if (!data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-paper p-8">
        <div className="font-display text-6xl leading-none md:text-8xl">
          404<span className="text-signal">.</span>
        </div>
        <p className="mt-4 text-sm uppercase text-smoke">clip not found or expired</p>
        <a
          href="/"
          className="mt-6 border-2 border-ink bg-ink px-5 py-3 text-xs font-bold uppercase text-paper hover:bg-signal hover:border-signal hover:text-ink"
        >
          &gt; GO HOME
        </a>
      </main>
    );
  }

  return <SharePlayer audioUrl={data.audioUrl} meta={data.meta} id={id} />;
}
