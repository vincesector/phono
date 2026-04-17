import { Mp3Encoder } from "@breezystack/lamejs";

export function encodeMp3(
  samples: Float32Array,
  sampleRate: number,
  bitrateKbps = 128
): Blob {
  const int16 = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const encoder = new Mp3Encoder(1, sampleRate, bitrateKbps);
  const chunks: Uint8Array[] = [];
  const frame = 1152;
  for (let i = 0; i < int16.length; i += frame) {
    const slice = int16.subarray(i, i + frame);
    const buf = encoder.encodeBuffer(slice);
    if (buf.length) chunks.push(buf);
  }
  const end = encoder.flush();
  if (end.length) chunks.push(end);

  return new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
}
