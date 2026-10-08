import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export const metadata = {
  title: "Create account",
  description: "Create a Clothing Delivery account and start shopping for clothing online.",
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto w-full max-w-md px-4 py-16" aria-hidden="true" />}
    >
      <RegisterForm />
    </Suspense>
  );
}
