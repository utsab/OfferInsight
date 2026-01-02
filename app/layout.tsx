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
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script dangerouslySetInnerHTML={{
          __html: `window.FontAwesomeConfig = { autoReplaceSvg: 'nest'};`
        }} />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
            ::-webkit-scrollbar { display: none; }
            html, body { font-family: 'Inter', sans-serif; width: 100%; margin: 0; padding: 0; overflow-x: hidden; }
          `
        }} />
      </head>
      <body className={`${inter.className} antialiased bg-gray-900 h-full w-full`} suppressHydrationWarning={true}>
        <Navbar />
        <main className="w-full">{children}</main>
      </body>
    </html>
  );
}
