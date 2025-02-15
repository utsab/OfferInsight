import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from 'auth';

export default async function Page2() {
  const session = await auth();
  if (!session?.user) {
    console.log("Unauthorized!!!!!!!!!!!!!!!!!!!!!!")
    redirect('/'); // Redirect to the sign-in page
  }
  return (
    <div>
      <h1>Onboarding Page 2</h1>
      <div>
        <Link href="/onboarding/page3">
          Go to Page 3
        </Link>
      </div>
      <div>
        <Link href="/onboarding/page1">
          Back to Page 1
        </Link>
      </div>
    </div>
  );
}