import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { buttonClassName } from "@/components/ui/Button";
import Logo from "@/components/branding/Logo";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <div className="mb-8 flex justify-center">
        <Logo size={46} />
      </div>
      <EmptyState
        title="Page not found"
        description="The page you are looking for does not exist or may have been moved."
        action={
          <Link href="/" className={buttonClassName()}>
            Back to home
          </Link>
        }
      />
    </div>
  );
}
