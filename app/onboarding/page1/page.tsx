import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from 'auth';

export default async function Page1() {
  const session = await auth();
  if (!session?.user) {
    console.log("Unauthorized!!!!!!!!!!!!!!!!!!!!!!")
    redirect('/'); // Redirect to the sign-in page
  }
  return (
    <div>
      <h1>Onboarding Page 1</h1>
      <Link href="/onboarding/page2">
        Go to Page 2
      </Link>
    </div>
  );
}