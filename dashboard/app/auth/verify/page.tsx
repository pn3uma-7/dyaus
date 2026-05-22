import { redirect } from 'next/navigation';
import { authPost } from '../../lib/api';
import { setSessionJwt } from '../../lib/session';

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) redirect('/');

  try {
    const { jwt } = await authPost('/auth/verify', { token });
    await setSessionJwt(jwt);
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-full max-w-sm space-y-4 px-6 text-center">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-semibold text-white">Link expired</h2>
          <p className="text-sm text-gray-400">This sign-in link has expired or already been used.</p>
          <a href="/" className="inline-block text-sm text-indigo-400 hover:text-indigo-300 underline">
            Request a new link
          </a>
        </div>
      </div>
    );
  }

  redirect('/dashboard');
}
