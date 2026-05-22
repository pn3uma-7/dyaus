import { redirect } from 'next/navigation';
import { VerifyButton } from './VerifyButton';

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect('/');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm space-y-6 px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Dyaus</h1>
          <p className="mt-2 text-sm text-gray-400">Click the button to complete sign-in</p>
        </div>
        <VerifyButton token={token} />
      </div>
    </div>
  );
}
