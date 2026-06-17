import { ParallaxTutorialNav } from './ParallaxTutorialNav';

export default function ParallaxTutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ParallaxTutorialNav />
      {children}
    </>
  );
}
