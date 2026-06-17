import dynamic from 'next/dynamic';
import { headers } from 'next/headers';
import { OsrIntroStatic } from '@/components/home/OsrIntroStatic';
import { isMobileUserAgent } from '@/lib/isMobileUserAgent';

const OsrIntroScroll = dynamic(
  () => import('@/components/home/OsrIntroScroll').then((mod) => mod.OsrIntroScroll),
  {
    loading: () => <div className="min-h-screen bg-white" aria-hidden />,
  },
);

export default async function Page() {
  const userAgent = (await headers()).get('user-agent') ?? '';
  const useStaticIntro = isMobileUserAgent(userAgent);

  return (
    <div className="-mt-[var(--navbar-height)] min-h-screen bg-white pt-[var(--navbar-height)]">
      {useStaticIntro ? <OsrIntroStatic /> : <OsrIntroScroll />}
    </div>
  );
}
