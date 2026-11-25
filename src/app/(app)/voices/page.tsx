import { Card, PageHeader } from "@/components/ui";
import { VoicePlay } from "@/components/VoicePlay";
import { Waveform } from "@/components/Waveform";
import { LANGUAGES, PRICE_PER_MIN, voicesFor } from "@/lib/catalog";

export const metadata = { title: "Voices" };

export default function VoicesPage() {
  return (
    <>
      <PageHeader eyebrow="Native speakers, recorded for real phone conversations" title="Voices" />
      <div className="space-y-10">
        {LANGUAGES.map((lang, li) => (
          <section key={lang.id}>
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="font-display text-[34px] leading-none">{lang.native}</h2>
              {lang.id !== "en" && <span className="text-[13px] text-faint">{lang.label}</span>}
              <span className="text-[13px] text-faint">· mixes in English words the way people really talk</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {voicesFor(lang.id).map((v, i) => (
                <Card key={v.id} className="rise flex items-center gap-4 p-4" style={{ animationDelay: `${(li * 4 + i) * 40}ms` }}>
                  <VoicePlay voice={v.id} lang={lang.id} className="h-12 w-12" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold">
                      {v.name}
                      {v.premium && <span className="rounded bg-signal-soft px-1.5 py-0.5 text-[10px] font-bold text-warm">PREMIUM</span>}
                    </p>
                    <p className="truncate text-[12.5px] text-muted">{v.gender === "female" ? "Female" : "Male"} · {v.tone}</p>
                    <Waveform seed={li * 10 + i + 3} bars={22} className="mt-2 h-5" color="bg-line-2" />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
        <p className="text-[12.5px] text-faint">
          Standard voices ₹{PRICE_PER_MIN.standard} / min · Premium ₹{PRICE_PER_MIN.premium} / min · billed per second of connected talk.
        </p>
      </div>
    </>
  );
}
