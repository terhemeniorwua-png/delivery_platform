import DashboardView from "./DashboardView";

export const metadata = {
  title: "My account",
  robots: { index: false },
};

export default function CustomerDashboardPage() {
  return <DashboardView />;
}
