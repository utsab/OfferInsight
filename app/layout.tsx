import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { UserButton } from "@/components/user-button";
import { Navbar } from '@/components/navbar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`} suppressHydrationWarning={true}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
