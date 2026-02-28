/**
 * Reusable pastel gradient blobs for page backgrounds.
 * Used on auth pages and can be dropped into any page for a Stripe-like wash.
 */
export default function GradientBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-[40%] -left-[5%] h-[80vh] w-[80vh] rounded-full bg-blue-300/30 blur-[180px]" />
      <div className="absolute -top-[35%] left-[25%] h-[70vh] w-[70vh] rounded-full bg-violet-300/25 blur-[180px]" />
      <div className="absolute -top-[38%] right-[5%] h-[75vh] w-[75vh] rounded-full bg-rose-300/25 blur-[180px]" />
      <div className="absolute -top-[30%] right-[30%] h-[60vh] w-[60vh] rounded-full bg-indigo-200/20 blur-[160px]" />
    </div>
  );
}
