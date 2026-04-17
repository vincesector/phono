import { KokoroTTS } from "kokoro-js";
import fs from "node:fs";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const SAMPLE_TEXT =
  "Phono runs entirely in your browser. Your text never touches a server. No signup, no API key, no paywall.";

const VOICES = [
  "af_heart", "af_bella", "af_nicole", "af_sarah", "af_sky",
  "af_aoede", "af_kore", "af_nova", "af_river", "af_alloy", "af_jessica",
  "am_adam", "am_michael", "am_onyx", "am_fenrir", "am_echo",
  "am_eric", "am_liam", "am_puck",
  "bf_emma", "bf_isabella", "bf_alice", "bf_lily",
  "bm_george", "bm_lewis", "bm_daniel", "bm_fable",
];

const sentences = SAMPLE_TEXT.split(/(?<=[.!?])\s+/)
  .map((s) => s.trim())
  .filter(Boolean);

function energy(samples) {
  let sum = 0;
  let nanCount = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    if (Number.isNaN(v)) {
      nanCount++;
      continue;
    }
    sum += Math.abs(v);
  }
  const nonNan = samples.length - nanCount;
  return {
    mean: nonNan > 0 ? sum / nonNan : 0,
    nanRatio: nanCount / samples.length,
  };
}

const ENERGY_THRESHOLD = 0.015;
const NAN_THRESHOLD = 0.01; // 1% NaN samples => broken

console.log(`Loading Kokoro model (fp16)...`);
const DEVICE = process.argv[2] === "--cpu" ? "cpu" : "wasm";
console.log(`Using device: ${DEVICE}`);
const tts = await KokoroTTS.from_pretrained(MODEL_ID, {
  dtype: "fp16",
  device: DEVICE,
});
console.log(`Model ready. Testing ${VOICES.length} voices × ${sentences.length} sentences...\n`);

const results = [];
for (const voice of VOICES) {
  const voiceResults = [];
  for (let si = 0; si < sentences.length; si++) {
    const s = sentences[si];
    const raw = await tts.generate(s, { voice, speed: 1 });
    const { mean, nanRatio } = energy(raw.audio);
    const sec = raw.audio.length / raw.sampling_rate;
    const silent = mean < ENERGY_THRESHOLD || nanRatio > NAN_THRESHOLD;
    voiceResults.push({ sentence: si + 1, sec, energy: mean, nanRatio, silent });
    results.push({ voice, sentence: si + 1, text: s, sec, energy: mean, nanRatio, silent });
  }
  const failCount = voiceResults.filter((r) => r.silent).length;
  const flag = failCount === 0 ? "  OK" : ` ${failCount} FAIL`;
  const summary = voiceResults
    .map((r) => `${r.sentence}:${r.energy.toFixed(3)}${r.silent ? "*" : ""}`)
    .join("  ");
  console.log(`${voice.padEnd(14)} ${flag}  [${summary}]`);
}

fs.writeFileSync(
  "voice-test-results.json",
  JSON.stringify(results, null, 2)
);

const broken = results.filter((r) => r.silent);
console.log(`\n=== ${broken.length} FAIL(s) ===`);
for (const r of broken) {
  console.log(`${r.voice} sentence ${r.sentence}: energy=${r.energy.toFixed(4)} (${r.sec.toFixed(2)}s)`);
}

const voiceFailures = {};
for (const r of broken) {
  voiceFailures[r.voice] = (voiceFailures[r.voice] ?? 0) + 1;
}
console.log(`\n=== VOICES WITH ANY FAILURE ===`);
for (const [v, n] of Object.entries(voiceFailures)) {
  console.log(`${v}: ${n} sentence(s) failed`);
}
