import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from 'auth';

export default async function Page4() {
  const session = await auth();
  if (!session?.user) {
    console.log("Unauthorized!!!!!!!!!!!!!!!!!!!!!!")
    redirect('/'); // Redirect to the sign-in page
  }
  return (
    <div>
      <h1>Onboarding Page 4</h1>
      <Link href="/onboarding/page3">
        Back to Page 3
      </Link>
    </div>
  );
}