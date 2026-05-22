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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-amber-50">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <img src="/dyaus.png" alt="Dyaus" className="h-28 w-28 object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">Dyaus</h1>
          <p className="mt-1 text-sm text-slate-500">Click below to complete sign-in</p>
        </div>
        <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-6">
          <VerifyButton token={token} />
        </div>
      </div>
    </div>
  );
}
