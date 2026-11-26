import { Card, PageHeader } from "@/components/ui";
import { VoicePlay } from "@/components/VoicePlay";
import { Waveform } from "@/components/Waveform";
import { LANGUAGES, PRICE_PER_MIN, voicesFor } from "@/lib/catalog";

export const metadata = { title: "Voices" };

export default function VoicesPage() {
  return (
    <>
      <PageHeader eyebrow="Native speakers, tuned for real phone conversations" title="Voices" />
      <div className="space-y-10">
        {LANGUAGES.map((lang, li) => (
          <section key={lang.id}>
            <div className="mb-4">
              <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
                {lang.native}
                {lang.id !== "en" && <span className="ml-2 text-[14px] font-normal tracking-normal text-faint">{lang.label}</span>}
              </h2>
              <p className="mt-0.5 text-[13px] text-muted">Mixes in English words the way people really talk.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {voicesFor(lang.id).map((v, i) => (
                <Card key={v.id} className="flex items-center gap-3.5 p-4">
                  <VoicePlay voice={v.id} lang={lang.id} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                      {v.name}
                      {v.premium && <span className="rounded-full border border-line px-1.5 py-px text-[10.5px] font-medium text-muted">Premium</span>}
                    </p>
                    <p className="truncate text-[12.5px] text-muted">{v.gender === "female" ? "Female" : "Male"}, {v.tone.charAt(0).toLowerCase() + v.tone.slice(1)}</p>
                    <Waveform seed={li * 10 + i + 3} bars={22} className="mt-2 h-4" color="bg-line-2" />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
        <p className="text-[13px] text-faint">
          Standard voices ₹{PRICE_PER_MIN.standard} per minute, premium ₹{PRICE_PER_MIN.premium} per minute, billed per second of connected talk.
        </p>
      </div>
    </>
  );
}
