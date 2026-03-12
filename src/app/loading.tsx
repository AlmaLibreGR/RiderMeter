export default function Loading() {
  return (
    <main className="rm-page-shell">
      <div className="rm-page-container">
        <section className="rm-hero">
          <div className="space-y-4">
            <div className="rm-skeleton h-6 w-32 rounded-full" />
            <div className="rm-skeleton h-12 w-2/3 rounded-2xl" />
            <div className="rm-skeleton h-5 w-1/2 rounded-xl" />
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rm-surface p-5">
              <div className="rm-skeleton h-4 w-24 rounded-full" />
              <div className="rm-skeleton mt-4 h-10 w-28 rounded-2xl" />
              <div className="rm-skeleton mt-4 h-4 w-36 rounded-full" />
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rm-surface-strong p-6">
            <div className="rm-skeleton h-5 w-40 rounded-full" />
            <div className="rm-skeleton mt-6 h-72 w-full rounded-[24px]" />
          </div>
          <div className="rm-surface-strong p-6">
            <div className="rm-skeleton h-5 w-40 rounded-full" />
            <div className="rm-skeleton mt-6 h-72 w-full rounded-[24px]" />
          </div>
        </section>
      </div>
    </main>
  );
}
