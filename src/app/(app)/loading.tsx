// Shown instantly while a page's live data loads. Shaped like the overview so nothing jumps.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse motion-reduce:animate-none">
      <div className="mb-8 space-y-2.5">
        <div className="h-3.5 w-56 rounded-full bg-line" />
        <div className="h-7 w-[min(420px,80%)] rounded-lg bg-line" />
      </div>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[136px] bg-surface p-5">
            <div className="h-3 w-20 rounded-full bg-line" />
            <div className="mt-3 h-7 w-24 rounded-md bg-line" />
            <div className="mt-4 h-3 w-32 rounded-full bg-line" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="h-[310px] rounded-xl border border-line bg-surface" />
        <div className="h-[310px] rounded-xl border border-line bg-surface" />
      </div>
    </div>
  );
}
