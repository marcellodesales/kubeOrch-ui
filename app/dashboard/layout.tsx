import DashboardProtectionRoute from "@/components/protectedroutes/DashboardProtectRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardProtectionRoute>{children}</DashboardProtectionRoute>;
}
