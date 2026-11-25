// Shown instantly while a page's live data loads.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-7 space-y-3">
        <div className="h-3 w-32 rounded-full bg-line" />
        <div className="h-10 w-[min(520px,80%)] rounded-xl bg-line/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[138px] rounded-2xl border border-line bg-surface p-5">
            <div className="h-3 w-24 rounded-full bg-line" />
            <div className="mt-4 h-9 w-20 rounded-lg bg-line/70 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="mt-5 h-[300px] rounded-2xl border border-line bg-surface animate-pulse" />
    </div>
  );
}
