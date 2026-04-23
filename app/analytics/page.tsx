import { AnalyticsScreen } from "@/components/analytics/analytics-screen";
import { requireUser } from "@/lib/auth/session";
import { getDashboardDataForUser, getEmptyDashboardData } from "@/lib/server/expense-dashboard";

export default async function AnalyticsPage() {
  const user = await requireUser();
  let data = getEmptyDashboardData();

  try {
    data = await getDashboardDataForUser(user.id);
  } catch (error) {
    console.error("[analytics/page] failed to load analytics data", error);
  }

  return <AnalyticsScreen data={data} />;
}
