import { redirect } from 'next/navigation';
import { auth } from '@/auth';

/** Deep Work rooms are for signed-in students only. */
export default async function DeepWorkLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect('/');
  return <div className="bg-white text-gray-900">{children}</div>;
}
