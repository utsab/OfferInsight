import Link from 'next/link';

export default function ParallaxTutorialIndexPage() {
  return (
    <main className="-mt-[var(--navbar-height)] min-h-screen bg-white px-6 pb-16 pt-[calc(var(--navbar-height)+4rem)] sm:px-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#F57360]">Tutorial</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Parallax walkthrough</h1>
        <p className="mt-4 leading-relaxed text-gray-600">
          Small steps in this repo — same ideas as the homepage intro scroll. Work through each step
          in order.
        </p>

        <ol className="mt-10 space-y-4">
          <li>
            <Link
              href="/parallax_tutorial/step1"
              className="block rounded-xl border border-gray-200 p-5 transition-colors hover:border-[#F57360]/40 hover:bg-orange-50/50"
            >
              <span className="font-semibold text-gray-900">Step 1 — Scroll track + scrub</span>
              <p className="mt-1 text-sm text-gray-600">
                Tall scroll track, fixed box, one ScrollTrigger moves the box with scroll.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/parallax_tutorial/step2"
              className="block rounded-xl border border-gray-200 p-5 transition-colors hover:border-[#F57360]/40 hover:bg-orange-50/50"
            >
              <span className="font-semibold text-gray-900">Step 2 — Timeline + crossfade</span>
              <p className="mt-1 text-sm text-gray-600">
                One timeline, multiple tweens — fade between Scene A and Scene B.
              </p>
            </Link>
          </li>
          <li className="rounded-xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">
            Step 3 — Inner content scroll (coming next)
          </li>
        </ol>
      </div>
    </main>
  );
}
