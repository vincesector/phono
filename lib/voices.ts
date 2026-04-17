export type VoiceId =
  | "af_heart" | "af_bella" | "af_nicole" | "af_sarah" | "af_sky"
  | "af_aoede" | "af_kore" | "af_nova" | "af_river" | "af_alloy" | "af_jessica"
  | "am_adam" | "am_michael" | "am_onyx" | "am_fenrir" | "am_echo"
  | "am_eric" | "am_liam" | "am_puck"
  | "bf_emma" | "bf_isabella" | "bf_alice" | "bf_lily"
  | "bm_george" | "bm_lewis" | "bm_daniel" | "bm_fable";

export type VoiceMeta = {
  id: VoiceId;
  label: string;
  accent: "US" | "UK";
  gender: "F" | "M";
  vibe: string;
};

export const VOICES: VoiceMeta[] = [
  { id: "af_heart",    label: "HEART",    accent: "US", gender: "F", vibe: "warm / default" },
  { id: "af_bella",    label: "BELLA",    accent: "US", gender: "F", vibe: "bright / clean" },
  { id: "af_nicole",   label: "NICOLE",   accent: "US", gender: "F", vibe: "intimate / asmr" },
  { id: "af_sarah",    label: "SARAH",    accent: "US", gender: "F", vibe: "neutral / news" },
  { id: "af_sky",      label: "SKY",      accent: "US", gender: "F", vibe: "young / calm" },
  { id: "af_aoede",    label: "AOEDE",    accent: "US", gender: "F", vibe: "melodic" },
  { id: "af_kore",     label: "KORE",     accent: "US", gender: "F", vibe: "confident" },
  { id: "af_nova",     label: "NOVA",     accent: "US", gender: "F", vibe: "soft / poetic" },
  { id: "af_river",    label: "RIVER",    accent: "US", gender: "F", vibe: "breathy" },
  { id: "af_alloy",    label: "ALLOY",    accent: "US", gender: "F", vibe: "metallic" },
  { id: "af_jessica",  label: "JESSICA",  accent: "US", gender: "F", vibe: "corporate" },
  { id: "am_adam",     label: "ADAM",     accent: "US", gender: "M", vibe: "clear / reliable" },
  { id: "am_michael",  label: "MICHAEL",  accent: "US", gender: "M", vibe: "deep / narrator" },
  { id: "am_onyx",     label: "ONYX",     accent: "US", gender: "M", vibe: "gravel / trailer" },
  { id: "am_fenrir",   label: "FENRIR",   accent: "US", gender: "M", vibe: "assertive" },
  { id: "am_echo",     label: "ECHO",     accent: "US", gender: "M", vibe: "expressive" },
  { id: "am_eric",     label: "ERIC",     accent: "US", gender: "M", vibe: "neutral / news" },
  { id: "am_liam",     label: "LIAM",     accent: "US", gender: "M", vibe: "young" },
  { id: "am_puck",     label: "PUCK",     accent: "US", gender: "M", vibe: "playful" },
  { id: "bf_emma",     label: "EMMA",     accent: "UK", gender: "F", vibe: "classic british" },
  { id: "bf_isabella", label: "ISABELLA", accent: "UK", gender: "F", vibe: "refined" },
  { id: "bf_alice",    label: "ALICE",    accent: "UK", gender: "F", vibe: "warm british" },
  { id: "bf_lily",     label: "LILY",     accent: "UK", gender: "F", vibe: "youthful" },
  { id: "bm_george",   label: "GEORGE",   accent: "UK", gender: "M", vibe: "distinguished" },
  { id: "bm_lewis",    label: "LEWIS",    accent: "UK", gender: "M", vibe: "modern british" },
  { id: "bm_daniel",   label: "DANIEL",   accent: "UK", gender: "M", vibe: "firm" },
  { id: "bm_fable",    label: "FABLE",    accent: "UK", gender: "M", vibe: "storyteller" },
];

export const DEFAULT_VOICE: VoiceId = "af_heart";
