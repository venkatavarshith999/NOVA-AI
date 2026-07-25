import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-9xl font-display font-black gradient-text mb-4">404</h1>
        <div className="text-6xl mb-6">🛸</div>
        <h2 className="text-2xl font-bold mb-2">Page not found</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          The page you are looking for has drifted into deep space.
        </p>
        <div className="flex gap-4">
          <Link href="/" className="px-6 py-3 rounded-xl glass font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Go Home
          </Link>
          <Link href="/research" className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium hover:opacity-90 transition-opacity">
            Go to Research
          </Link>
        </div>
      </main>
    </>
  );
}
