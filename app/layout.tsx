import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { UserButton } from "@/components/user-button";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <UserButton />
        {children}
      </body>
    </html>
  );
}
