"use client";

import { VOICES, type VoiceId } from "@/lib/voices";

type Props = {
  selected: VoiceId;
  onSelect: (v: VoiceId) => void;
  disabled?: boolean;
};

export function VoiceGrid({ selected, onSelect, disabled }: Props) {
  return (
    <div>
      <div className="mb-3 flex items-end justify-between border-b-2 border-ink pb-2">
        <h3 className="text-xs uppercase tracking-widest">[ VOICE ]</h3>
        <span className="text-xs text-smoke">
          {VOICES.length} available
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        {VOICES.map((v) => {
          const active = v.id === selected;
          return (
            <button
              key={v.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(v.id)}
              className={[
                "group flex flex-col items-start border-2 p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-ink bg-ink text-paper"
                  : "border-ink bg-paper hover:bg-ink hover:text-paper",
              ].join(" ")}
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-display text-xl leading-none">
                  {v.label}
                </span>
                <span
                  className={[
                    "border px-1 text-[10px]",
                    active ? "border-paper" : "border-ink group-hover:border-paper",
                  ].join(" ")}
                >
                  {v.accent}/{v.gender}
                </span>
              </div>
              <span className="mt-1 text-[10px] uppercase opacity-70">
                {v.vibe}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
