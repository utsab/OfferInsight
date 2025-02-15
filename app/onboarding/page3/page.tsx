import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from 'auth';

export default async function Page3() {
  const session = await auth();
  if (!session?.user) {
    console.log("Unauthorized!!!!!!!!!!!!!!!!!!!!!!")
    redirect('/'); // Redirect to the sign-in page
  }
  return (
    <div>
      <div>
        <h1>Onboarding Page 3</h1>
        <Link href="/onboarding/page4">
          Go to Page 4
        </Link>
      </div>
      <div>
        <Link href="/onboarding/page2">
          Back to Page 2
        </Link>
      </div>
    </div>
  );
}