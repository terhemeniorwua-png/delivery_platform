import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign in",
  description: "Sign in to your Clothing Delivery account to shop and track orders.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto w-full max-w-md px-4 py-16" aria-hidden="true" />}
    >
      <LoginForm />
    </Suspense>
  );
}
