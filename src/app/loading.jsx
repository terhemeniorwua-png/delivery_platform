import Spinner from "@/components/ui/Spinner";
import { LogoMark } from "@/components/branding/Logo";

/** Route-level loading state (App Router `loading` convention). */
export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-muted"
      role="status"
      aria-label="Loading page"
    >
      <LogoMark size={44} className="animate-pulse" />
      <Spinner size="lg" label="Loading page" />
    </div>
  );
}