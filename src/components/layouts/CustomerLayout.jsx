import RoleGate from "@/components/auth/RoleGate";
import DashboardLayout from "./DashboardLayout";

/**
 * Customer area shell (app/(customer)/layout.jsx in Phase 2+):
 *
 *   export default function Layout({ children }) {
 *     return <CustomerLayout navigation={[...]}>{children}</CustomerLayout>;
 *   }
 *
 * Guards the whole section: only authenticated CUSTOMERs pass; anyone else
 * is redirected to /login or their own area by <RoleGate>.
 */
export default function CustomerLayout({ children, navigation = [], ...rest }) {
  return (
    <RoleGate roles={["CUSTOMER"]}>
      <DashboardLayout
        brand="Clothing Delivery"
        title="My account"
        navigation={navigation}
        {...rest}
      >
        {children}
      </DashboardLayout>
    </RoleGate>
  );
}
