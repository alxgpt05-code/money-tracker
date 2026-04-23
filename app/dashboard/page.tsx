import { MobileDashboardScreen } from "@/components/dashboard/mobile-dashboard-screen";
import { requireUser } from "@/lib/auth/session";
import { getDashboardDataForUser, getEmptyDashboardData } from "@/lib/server/expense-dashboard";

export default async function DashboardPage() {
  const user = await requireUser();
  let data = getEmptyDashboardData();

  try {
    data = await getDashboardDataForUser(user.id);
  } catch (error) {
    console.error("[dashboard/page] failed to load dashboard data", error);
  }

  return <MobileDashboardScreen data={data} />;
}
