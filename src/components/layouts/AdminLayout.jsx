import RoleGate from "@/components/auth/RoleGate";
import DashboardLayout from "./DashboardLayout";

/**
 * Admin area shell (app/(admin)/layout.jsx in Phase 2+).
 *
 * ADMIN-only. The backend additionally enforces business rules such as the
 * maximum of 5 administrator accounts — the frontend never decides roles.
 */
export default function AdminLayout({ children, navigation = [], ...rest }) {
  return (
    <RoleGate roles={["ADMIN"]}>
      <DashboardLayout
        brand="Clothing Delivery"
        title="Admin"
        navigation={navigation}
        {...rest}
      >
        {children}
      </DashboardLayout>
    </RoleGate>
  );
}
