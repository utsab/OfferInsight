import dynamic from 'next/dynamic';

const OsrIntroScroll = dynamic(
  () => import('@/components/home/OsrIntroScroll').then((mod) => mod.OsrIntroScroll),
  {
    loading: () => <div className="min-h-screen bg-white" aria-hidden />,
  },
);

export default function Page() {
  // Always use the scroll intro (including compact <1278). The flat
  // `OsrIntroStatic` path is kept in the repo but no longer routed here.
  return (
    <div className="-mt-[var(--navbar-height)] min-h-screen bg-white pt-[var(--navbar-height)]">
      <OsrIntroScroll />
    </div>
  );
}
