'use client';

import Link from 'next/link';
import { createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { LineChart } from 'lucide-react';

type NavbarTheme = 'light' | 'dark';

const NavbarThemeContext = createContext<NavbarTheme>('dark');

export function useNavbarTheme() {
  return useContext(NavbarThemeContext);
}

type NavbarShellProps = {
  children: React.ReactNode;
};

export function NavbarShell({ children }: NavbarShellProps) {
  const isHomePage = usePathname() === '/';
  const theme: NavbarTheme = isHomePage ? 'light' : 'dark';

  return (
    <NavbarThemeContext.Provider value={theme}>
      <nav
        id="site-navbar"
        className={`fixed top-0 left-0 right-0 z-[110] w-full border-b border-light-steel-blue ${
          isHomePage ? 'bg-white' : 'bg-gradient-to-br from-midnight-blue to-gray-900'
        }`}
      >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <Link href="/" className="flex min-w-0 flex-shrink-0 items-center space-x-2 sm:space-x-3">
          <LineChart className="flex-shrink-0 text-xl text-electric-blue sm:text-2xl" />
          <h1
            className={`truncate text-lg font-bold sm:text-2xl ${
              isHomePage ? 'text-gray-900' : 'text-white'
            }`}
          >
            OpenSourceResumeBook
          </h1>
        </Link>
        <div className="user-button-container flex-shrink-0">{children}</div>
      </div>
    </nav>
    </NavbarThemeContext.Provider>
  );
}
