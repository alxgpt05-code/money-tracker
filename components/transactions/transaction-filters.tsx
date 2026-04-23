import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { transactionTypeLabels } from "@/lib/constants/finance";

export function TransactionFilters({
  accounts,
  categories,
  params,
}: {
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  params: Record<string, string | undefined>;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <form className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={params.q} className="h-12 pl-11" placeholder="Поиск по комментарию" />
          </div>
            <Input name="from" type="date" defaultValue={params.from} className="h-12" />
            <Input name="to" type="date" defaultValue={params.to} className="h-12" />
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <Select name="accountId" defaultValue={params.accountId} className="h-12">
              <option value="">Все счета</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
            <Select name="type" defaultValue={params.type} className="h-12">
              <option value="">Все типы</option>
              {Object.entries(transactionTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select name="categoryId" defaultValue={params.categoryId} className="h-12">
              <option value="">Все категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Button type="submit" className="h-12 w-full md:w-auto">
              Показать
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
