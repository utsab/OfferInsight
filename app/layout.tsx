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
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `window.FontAwesomeConfig = { autoReplaceSvg: 'nest'};`
        }} />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
            ::-webkit-scrollbar { display: none; }
            body { font-family: 'Inter', sans-serif; }
          `
        }} />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning={true}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
