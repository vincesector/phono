export type VoiceId =
  | "af_heart" | "af_bella" | "af_sarah"
  | "af_aoede" | "af_kore" | "af_nova" | "af_river" | "af_alloy" | "af_jessica"
  | "am_onyx" | "am_fenrir" | "am_echo" | "am_eric"
  | "bf_emma" | "bf_isabella" | "bf_alice"
  | "bm_george" | "bm_lewis";

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
  { id: "af_sarah",    label: "SARAH",    accent: "US", gender: "F", vibe: "neutral / news" },
  { id: "af_aoede",    label: "AOEDE",    accent: "US", gender: "F", vibe: "melodic" },
  { id: "af_kore",     label: "KORE",     accent: "US", gender: "F", vibe: "confident" },
  { id: "af_nova",     label: "NOVA",     accent: "US", gender: "F", vibe: "soft / poetic" },
  { id: "af_river",    label: "RIVER",    accent: "US", gender: "F", vibe: "breathy" },
  { id: "af_alloy",    label: "ALLOY",    accent: "US", gender: "F", vibe: "metallic" },
  { id: "af_jessica",  label: "JESSICA",  accent: "US", gender: "F", vibe: "corporate" },
  { id: "am_onyx",     label: "ONYX",     accent: "US", gender: "M", vibe: "gravel / trailer" },
  { id: "am_fenrir",   label: "FENRIR",   accent: "US", gender: "M", vibe: "assertive" },
  { id: "am_echo",     label: "ECHO",     accent: "US", gender: "M", vibe: "expressive" },
  { id: "am_eric",     label: "ERIC",     accent: "US", gender: "M", vibe: "neutral / news" },
  { id: "bf_emma",     label: "EMMA",     accent: "UK", gender: "F", vibe: "classic british" },
  { id: "bf_isabella", label: "ISABELLA", accent: "UK", gender: "F", vibe: "refined" },
  { id: "bf_alice",    label: "ALICE",    accent: "UK", gender: "F", vibe: "warm british" },
  { id: "bm_george",   label: "GEORGE",   accent: "UK", gender: "M", vibe: "distinguished" },
  { id: "bm_lewis",    label: "LEWIS",    accent: "UK", gender: "M", vibe: "modern british" },
];

export const DEFAULT_VOICE: VoiceId = "af_heart";
