// src/app/unauthorized/page.tsx

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-red-600">Unauthorized</h1>
      <p className="text-lg text-gray-700">
        You do not have permission to view this page.
      </p>
      <Link href="/dashboard" className="mt-4 text-blue-500 hover:underline">
        Go to Dashboard
      </Link>
    </div>
  );
}
