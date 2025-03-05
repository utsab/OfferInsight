"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '../server';
import SideNav from '@/app/ui/dashboard/sidenav';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function authenticate() {
      const session = await checkAuth();
      if (!session?.user) {
        router.push('/'); // Redirect to the sign-in page
      } else {
        setLoading(false);
      }
    }
    authenticate();
  }, [router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}