import dynamic from 'next/dynamic';

const OsrIntroScroll = dynamic(
  () => import('@/components/home/OsrIntroScroll').then((mod) => mod.OsrIntroScroll),
  {
    loading: () => <div className="min-h-screen bg-white" aria-hidden />,
  },
);

export default function Page() {
  return (
    <div className="-mt-[var(--navbar-height)] min-h-screen bg-white pt-[var(--navbar-height)]">
      <OsrIntroScroll />
    </div>
  );
}
