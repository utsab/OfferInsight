import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/db'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.email) redirect('/')
  
  const progress = (await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { onboardingProgress: true }
  }))?.onboardingProgress ?? 0

  switch (progress) {
    case 0:
      redirect('/onboarding/page1')
    case 1:
      redirect('/onboarding/page2')
    case 2:
      redirect('/onboarding/page3')
    case 3:
    default:
      // Onboarding complete, allow dashboard access
      break
  }

  return <div className="min-h-screen bg-gray-900 text-white">{children}</div>
}
