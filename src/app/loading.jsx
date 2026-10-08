import { CenteredSpinner } from "@/components/ui/Spinner";

/** Route-level loading state (App Router `loading` convention). */
export default function Loading() {
  return <CenteredSpinner label="Loading page" />;
}
