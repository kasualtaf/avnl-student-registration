import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-gray-700">Loading Dashboard...</h2>
      <p className="text-gray-500 mt-2 text-sm">Please wait while we securely verify your session.</p>
    </div>
  );
}
