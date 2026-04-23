import { HistoryList } from "@/components/history/history-list";
import { requireUser } from "@/lib/auth/session";
import { getDashboardDataForUser, getEmptyDashboardData } from "@/lib/server/expense-dashboard";

export default async function HistoryPage() {
  const user = await requireUser();
  let data = getEmptyDashboardData();

  try {
    data = await getDashboardDataForUser(user.id);
  } catch (error) {
    console.error("[history/page] failed to load history data", error);
  }

  return <HistoryList data={data} />;
}
