import RoleGate from "@/components/auth/RoleGate";
import DashboardLayout from "./DashboardLayout";

/**
 * Rider area shell (app/(rider)/layout.jsx in Phase 2+).
 *
 * Only approved RIDERs pass the gate. A customer with a PENDING rider
 * application stays in the customer area until an admin approves them —
 * the backend controls the role, the frontend only reflects it.
 */
export default function RiderLayout({ children, navigation = [], ...rest }) {
  return (
    <RoleGate roles={["RIDER"]}>
      <DashboardLayout
        brand="Clothing Delivery"
        title="Rider dashboard"
        navigation={navigation}
        {...rest}
      >
        {children}
      </DashboardLayout>
    </RoleGate>
  );
}
