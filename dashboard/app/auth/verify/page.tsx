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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-sky-50 to-amber-100">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="w-44 h-44 rounded-full bg-amber-50 border-2 border-amber-300 shadow-lg flex items-center justify-center mx-auto mb-5">
            <img src="/dyaus.png" alt="Dyaus" className="h-36 w-36 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Dyaus</h1>
          <p className="mt-1 text-sm text-slate-500">Click below to complete sign-in</p>
        </div>
        <div className="bg-white/85 rounded-2xl border border-sky-200 shadow-sm p-6 backdrop-blur-sm">
          <VerifyButton token={token} />
        </div>
      </div>
    </div>
  );
}
