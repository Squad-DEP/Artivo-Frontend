import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-lg">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-2 tracking-tighter">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>

          <div className="mb-6 text-gray-600">
            <p>Sorry, we couldn't find the page you're looking for.</p>
            <p className="mt-2">
              The page may have been moved, deleted, or never existed.
            </p>
          </div>

          <Link href="/" className="px-5 py-2.5 rounded-md inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
