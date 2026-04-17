# PHONO

**Browser-native text-to-speech. Free, forever. No signup, no API key, no paywall.**

Phono runs [Kokoro-82M](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) entirely inside your browser via [transformers.js](https://huggingface.co/docs/transformers.js). Your text never touches a server. Generate audio, download MP3, share a link.

Live: **[phonoapp.vercel.app](https://phonoapp.vercel.app)**

## Stack

- Next.js 16 + React 19
- Tailwind CSS v4
- kokoro-js 1.2 (ONNX Runtime Web, WASM backend, fp16 weights)
- `@breezystack/lamejs` for MP3 encoding in the browser
- `@vercel/blob` for share-link storage
- Hosted on Vercel

## Why

ElevenLabs is $22/month. The open-source community has shipped a 82M-parameter TTS model that produces perfectly usable speech on a laptop, with zero inference cost. Phono is a thin, brutalist wrapper around that.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). First generation downloads ~165MB of model weights (cached after).

## Share links (optional)

Share functionality requires a [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store. Copy `.env.local.example` to `.env.local` and fill in:

```
BLOB_READ_WRITE_TOKEN=...
NEXT_PUBLIC_BLOB_BASE_URL=https://XXXXX.public.blob.vercel-storage.com
```

Download and tweet buttons work without these. The follow CTA is hardcoded to [@0xEvinho](https://x.com/0xEvinho).

## License

MIT (this code). The Kokoro model is licensed Apache 2.0.

Built by [@0xEvinho](https://x.com/0xEvinho).
