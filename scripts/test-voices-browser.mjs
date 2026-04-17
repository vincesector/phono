import { chromium } from "playwright";

const URL = "https://phonoapp.vercel.app/phono";
const VOICES = [
  "af_heart", "af_bella", "af_nicole", "af_sarah", "af_sky",
  "af_aoede", "af_kore", "af_nova", "af_river", "af_alloy", "af_jessica",
  "am_adam", "am_michael", "am_onyx", "am_fenrir", "am_echo",
  "am_eric", "am_liam", "am_puck",
  "bf_emma", "bf_isabella", "bf_alice", "bf_lily",
  "bm_george", "bm_lewis", "bm_daniel", "bm_fable",
];
const SAMPLE_TEXT =
  "Phono runs entirely in your browser. Your text never touches a server. No signup, no API key, no paywall.";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

page.on("console", (msg) => {
  const t = msg.text();
  if (t.startsWith("[phono]") || t.includes("TEST:")) console.log(">", t);
});

console.log(`Navigating ${URL}...`);
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });

console.log("Waiting for model to load (click SPEAK once, then model loads)...");
await page.waitForFunction(
  () => (window).__phono_tts !== undefined,
  null,
  { timeout: 180_000, polling: 1000 }
);
console.log("Model loaded.\n");

const results = await page.evaluate(
  async ([voices, text]) => {
    const tts = (window).__phono_tts;
    const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

    function energy(samples) {
      let sum = 0;
      let nanCount = 0;
      for (let i = 0; i < samples.length; i++) {
        const v = samples[i];
        if (Number.isNaN(v)) { nanCount++; continue; }
        sum += Math.abs(v);
      }
      const nonNan = samples.length - nanCount;
      return {
        mean: nonNan > 0 ? sum / nonNan : 0,
        nanRatio: nanCount / samples.length,
      };
    }

    const out = [];
    for (const voice of voices) {
      const per = [];
      for (let si = 0; si < sentences.length; si++) {
        const s = sentences[si];
        const raw = await tts.generate(s, { voice, speed: 1 });
        const { mean, nanRatio } = energy(raw.audio);
        const sec = raw.audio.length / raw.sampling_rate;
        const broken = mean < 0.015 || nanRatio > 0.01;
        per.push({ sentence: si + 1, text: s, sec, mean, nanRatio, broken });
        console.log(`TEST: ${voice} s${si + 1} sec=${sec.toFixed(2)} mean=${mean.toFixed(4)} nan=${(nanRatio*100).toFixed(1)}% ${broken ? "BROKEN" : "ok"}`);
      }
      out.push({ voice, per });
    }
    return out;
  },
  [VOICES, SAMPLE_TEXT]
);

console.log("\n=========================================");
console.log("SUMMARY");
console.log("=========================================\n");

const brokenByVoice = {};
for (const r of results) {
  const badSentences = r.per.filter((p) => p.broken).map((p) => p.sentence);
  if (badSentences.length > 0) {
    brokenByVoice[r.voice] = badSentences;
  }
  const status = badSentences.length === 0 ? "OK    " : `FAIL ${badSentences.length}`;
  const detail = r.per
    .map((p) => `${p.sentence}:${p.broken ? (p.nanRatio > 0 ? `NaN${(p.nanRatio*100).toFixed(0)}%` : "SIL") : p.mean.toFixed(3)}`)
    .join("  ");
  console.log(`${r.voice.padEnd(14)} ${status}  [${detail}]`);
}

console.log("\n=== BROKEN VOICES ===");
for (const [v, sents] of Object.entries(brokenByVoice)) {
  console.log(`${v}: sentence ${sents.join(", ")}`);
}
console.log(`\nTotal: ${Object.keys(brokenByVoice).length} broken, ${VOICES.length - Object.keys(brokenByVoice).length} working`);

import fs from "node:fs";
fs.writeFileSync("voice-browser-results.json", JSON.stringify({ results, brokenByVoice }, null, 2));

await browser.close();
