import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata = {
  title: "Reset password",
  description: "Request password reset instructions for your Clothing Delivery account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}