"use server";

import { Prisma, PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endOfMonth, startOfMonth } from "date-fns";
import { clearSession, createSession, authenticate, registerUser, requireUser, requireUserContext, setActiveWalletCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { calculateBalancesByAccount, toDecimal } from "@/lib/services/balances";
import { buildForecast } from "@/lib/services/forecast";
import type { getAppData } from "@/lib/services/finance";
import { loginSchema } from "@/lib/validations/auth";
import { registerSchema } from "@/lib/validations/register";
import { monthlySnapshotSchema, walletSettingsSchema } from "@/lib/validations/settings";
import { transactionSchema } from "@/lib/validations/transaction";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

async function refreshWalletBalances(tx: TxClient, walletId: string) {
  const wallet = await tx.wallet.findUnique({
    where: { id: walletId },
    include: {
      accounts: true,
      transactions: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!wallet) return;

  const balances = calculateBalancesByAccount({
    accounts: wallet.accounts,
    transactions: wallet.transactions,
  });

  await Promise.all(
    wallet.accounts.map((account) =>
      tx.account.update({
        where: { id: account.id },
        data: { currentBalance: toDecimal(balances[account.id] ?? account.initialBalance) },
      }),
    ),
  );
}

async function refreshForecastSnapshots(tx: TxClient, userId: string) {
  const data = await tx.wallet.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
    include: {
      accounts: {
        include: {
          interestHistory: true,
        },
      },
      salarySchedules: true,
      snapshots: {
        include: {
          account: true,
        },
      },
      transactions: {
        include: {
          category: true,
          sourceAccount: true,
          destinationAccount: true,
        },
      },
    },
  });

  const categories = await tx.category.findMany({ where: { userId } });
  const appData: Awaited<ReturnType<typeof getAppData>> = {
    walletList: data,
    activeWallet: data[0] ?? null,
    activeWalletId: data[0]?.id ?? null,
    wallets: data,
    categories,
    forecasts: [] as Awaited<ReturnType<typeof getAppData>>["forecasts"],
  };

  const forecasts = buildForecast(appData);

  await tx.forecastSnapshot.deleteMany({ where: { userId } });
  await tx.forecastSnapshot.createMany({
    data: forecasts.map((item, index) => ({
      userId,
      walletId: data[0]?.id ?? null,
      period: index === 0 ? "THREE_MONTHS" : index === 1 ? "SIX_MONTHS" : "TWELVE_MONTHS",
      projectedCapital: toDecimal(item.projectedCapital),
      averageMonthlyIncome: toDecimal(item.averageMonthlyIncome),
      averageMonthlyExpense: toDecimal(item.averageMonthlyExpense),
      expenseTrend: new Prisma.Decimal(item.expenseTrend.toFixed(4)),
      fixedExpenses: toDecimal(item.recurringExpense),
      variableExpenses: toDecimal(Math.max(item.averageMonthlyExpense - item.recurringExpense, 0)),
      recurringIncome: toDecimal(item.recurringIncome),
      snapshotDate: new Date(),
    })),
  });
}

function buildTransactionRedirect(target?: string, message?: string) {
  const base = target && target.startsWith("/") ? target : "/transactions";
  if (!message) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}success=${encodeURIComponent(message)}`;
}

export async function loginAction(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ошибка входа" };
  }

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    return { error: "Неверный email или пароль" };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function registerAction(_: unknown, formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ошибка регистрации" };
  }

  const result = await registerUser(parsed.data);
  if ("error" in result) {
    return { error: result.error };
  }

  await createSession(result.user.id);
  redirect("/settings/wallet");
}

export async function upsertTransactionAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const parsed = transactionSchema.safeParse({
    id: formData.get("id") || undefined,
    redirectTo: formData.get("redirectTo") || undefined,
    walletId: formData.get("walletId"),
    sourceAccountId: formData.get("sourceAccountId") || undefined,
    destinationAccountId: formData.get("destinationAccountId") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    type: formData.get("type"),
    amount: formData.get("amount"),
    transactionDate: formData.get("transactionDate"),
    note: formData.get("note") || undefined,
    isRecurring: formData.get("isRecurring") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Не удалось сохранить операцию" };
  }

  const data = parsed.data;
  const wallet = await prisma.wallet.findFirst({
    where: { id: data.walletId, userId: user.id },
    include: { accounts: true },
  });

  if (!wallet) {
    return { error: "Кошелёк не найден" };
  }

  const amount = toDecimal(data.amount);

  const targetRedirect = buildTransactionRedirect(data.redirectTo, data.id ? "updated" : "created");

  await prisma.$transaction(async (tx) => {
    if (data.id) {
      const existing = await tx.transaction.findFirst({
        where: {
          id: data.id,
          wallet: { userId: user.id },
        },
      });

      if (!existing) {
        throw new Error("Операция не найдена");
      }

      await tx.transaction.update({
        where: { id: existing.id },
        data: {
          walletId: data.walletId,
          sourceAccountId: data.sourceAccountId || null,
          destinationAccountId: data.destinationAccountId || null,
          categoryId: data.categoryId || null,
          type: data.type,
          amount,
          note: data.note,
          transactionDate: new Date(data.transactionDate),
          isRecurring: data.isRecurring ?? false,
          affectsCapital: !["TRANSFER", "SAVINGS_TOPUP", "DEPOSIT_TOPUP"].includes(data.type),
        },
      });

      await refreshWalletBalances(tx, existing.walletId);
      if (existing.walletId !== data.walletId) {
        await refreshWalletBalances(tx, data.walletId);
      }
    } else {
      await tx.transaction.create({
        data: {
          walletId: data.walletId,
          sourceAccountId: data.sourceAccountId || null,
          destinationAccountId: data.destinationAccountId || null,
          categoryId: data.categoryId || null,
          type: data.type,
          amount,
          note: data.note,
          transactionDate: new Date(data.transactionDate),
          isRecurring: data.isRecurring ?? false,
          affectsCapital: !["TRANSFER", "SAVINGS_TOPUP", "DEPOSIT_TOPUP"].includes(data.type),
        },
      });

      await refreshWalletBalances(tx, data.walletId);
    }

    await refreshForecastSnapshots(tx, user.id);
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/transactions/new");
  revalidatePath("/accounts");
  revalidatePath("/analytics");
  revalidatePath("/settings/wallet");
  redirect(targetRedirect);
}

export async function createWalletAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { error: "Введите название кошелька" };
  }

  const slug = `${name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9а-я-]/gi, "")}-${Date.now()}`;
  const description = String(formData.get("description") ?? "").trim();
  const walletCount = await prisma.wallet.count({ where: { userId: user.id } });

  await prisma.wallet.create({
    data: {
      userId: user.id,
      name,
      slug,
      description: description || null,
      trackingStartDate: new Date(),
      sortOrder: walletCount,
    },
  });

  const latestWallet = await prisma.wallet.findFirst({
    where: { userId: user.id, slug },
  });

  if (latestWallet) {
    await setActiveWalletCookie(latestWallet.id);
  }

  revalidatePath("/settings/wallet");
  revalidatePath("/dashboard");
  return { success: "Кошелёк создан" };
}

export async function setActiveWalletAction(formData: FormData) {
  const { user } = await requireUserContext();
  const walletId = String(formData.get("walletId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  const wallet = await prisma.wallet.findFirst({
    where: {
      id: walletId,
      userId: user.id,
      isArchived: false,
    },
  });

  if (wallet) {
    await setActiveWalletCookie(wallet.id);
  }

  redirect(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
}

export async function archiveWalletAction(formData: FormData) {
  const { user, activeWallet } = await requireUserContext();
  const walletId = String(formData.get("walletId") ?? "");
  if (!walletId) return;

  const wallet = await prisma.wallet.findFirst({
    where: { id: walletId, userId: user.id },
  });
  if (!wallet) return;

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { isArchived: true },
  });

  if (activeWallet?.id === wallet.id) {
    const nextWallet = await prisma.wallet.findFirst({
      where: { userId: user.id, isArchived: false, id: { not: wallet.id } },
      orderBy: { sortOrder: "asc" },
    });
    if (nextWallet) {
      await setActiveWalletCookie(nextWallet.id);
    }
  }

  revalidatePath("/settings/wallet");
  revalidatePath("/dashboard");
  redirect("/settings/wallet");
}

export async function deleteTransactionAction(formData: FormData) {
  const user = await requireUser();
  const transactionId = String(formData.get("transactionId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/transactions");

  if (!transactionId) return;

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, wallet: { userId: user.id } },
  });

  if (!transaction) return;

  await prisma.$transaction(async (tx) => {
    await tx.transaction.delete({ where: { id: transactionId } });
    await refreshWalletBalances(tx, transaction.walletId);
    await refreshForecastSnapshots(tx, user.id);
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/analytics");
  redirect(buildTransactionRedirect(redirectTo, "deleted"));
}

export async function updateWalletSettingsAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const parsed = walletSettingsSchema.safeParse({
    walletId: formData.get("walletId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    trackingStartDate: formData.get("trackingStartDate"),
    salaryDayPrimary: formData.get("salaryDayPrimary"),
    salaryDayAdvance: formData.get("salaryDayAdvance"),
    salaryAmountPrimary: formData.get("salaryAmountPrimary"),
    salaryAmountAdvance: formData.get("salaryAmountAdvance"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ошибка сохранения настроек" };
  }

  const wallet = await prisma.wallet.findFirst({
    where: { id: parsed.data.walletId, userId: user.id },
  });

  if (!wallet) {
    return { error: "Кошелёк не найден" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        trackingStartDate: new Date(parsed.data.trackingStartDate),
      },
    });

    const schedules = await tx.salarySchedule.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "asc" },
    });

    if (schedules[0]) {
      await tx.salarySchedule.update({
        where: { id: schedules[0].id },
        data: { dayOfMonth: parsed.data.salaryDayPrimary, amount: toDecimal(parsed.data.salaryAmountPrimary) },
      });
    }
    if (schedules[1]) {
      await tx.salarySchedule.update({
        where: { id: schedules[1].id },
        data: { dayOfMonth: parsed.data.salaryDayAdvance, amount: toDecimal(parsed.data.salaryAmountAdvance) },
      });
    }

    for (const [key, value] of formData.entries()) {
      if (typeof value !== "string") continue;
      if (key.startsWith("initialBalance:")) {
        const accountId = key.replace("initialBalance:", "");
        await tx.account.update({
          where: { id: accountId },
          data: { initialBalance: toDecimal(Number(value)) },
        });
      }

      if (key.startsWith("interestRate:")) {
        const accountId = key.replace("interestRate:", "");
        await tx.account.update({
          where: { id: accountId },
          data: { currentInterestRate: toDecimal(Number(value)) },
        });
      }
    }

    await refreshWalletBalances(tx, wallet.id);
    await refreshForecastSnapshots(tx, user.id);
  });

  revalidatePath("/settings/wallet");
  revalidatePath("/dashboard");
  return { success: "Настройки обновлены" };
}

export async function saveMonthlySnapshotAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const parsed = monthlySnapshotSchema.safeParse({
    walletId: formData.get("walletId"),
    accountId: formData.get("accountId"),
    monthDate: formData.get("monthDate"),
    actualBalance: formData.get("actualBalance"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Не удалось сохранить факт месяца" };
  }

  const wallet = await prisma.wallet.findFirst({
    where: { id: parsed.data.walletId, userId: user.id },
    include: {
      accounts: true,
      transactions: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!wallet) {
    return { error: "Кошелёк не найден" };
  }

  const account = wallet.accounts.find((item) => item.id === parsed.data.accountId);
  if (!account) {
    return { error: "Счёт не найден" };
  }

  const monthDate = startOfMonth(new Date(parsed.data.monthDate));
  const calculatedBalance = calculateBalancesByAccount({
    accounts: [account],
    transactions: wallet.transactions,
    asOf: endOfMonth(monthDate),
  })[account.id];

  const actualBalance = toDecimal(parsed.data.actualBalance);
  const deviation = actualBalance.sub(toDecimal(calculatedBalance));

  await prisma.monthlySnapshot.upsert({
    where: {
      accountId_monthDate: {
        accountId: account.id,
        monthDate,
      },
    },
    update: {
      calculatedBalance: toDecimal(calculatedBalance),
      actualBalance,
      deviation,
    },
    create: {
      walletId: wallet.id,
      accountId: account.id,
      monthDate,
      calculatedBalance: toDecimal(calculatedBalance),
      actualBalance,
      deviation,
    },
  });

  revalidatePath("/settings/wallet");
  revalidatePath("/dashboard");
  revalidatePath("/monthly-close");
  return { success: "Закрытие месяца сохранено" };
}

export async function createCategoryAction(_: unknown, formData: FormData) {
  const { user, activeWallet } = await requireUserContext();
  const walletId = String(formData.get("walletId") ?? activeWallet?.id ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!walletId) {
    return { error: "Активный кошелёк не найден" };
  }

  if (name.length < 2) {
    return { error: "Введите название категории" };
  }

  const wallet = await prisma.wallet.findFirst({
    where: { id: walletId, userId: user.id },
  });

  if (!wallet) {
    return { error: "Кошелёк не найден" };
  }

  const slugBase = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-я-]/gi, "")
    .slice(0, 40);

  const category = await prisma.category.create({
    data: {
      userId: user.id,
      walletId: wallet.id,
      name,
      slug: `${slugBase || "category"}-${Date.now()}`,
      kind: "EXPENSE",
      color: "#b6ff4d",
    },
  });

  revalidatePath("/transactions/new");
  revalidatePath("/transactions");

  return {
    success: "Категория добавлена",
    category: {
      id: category.id,
      name: category.name,
      kind: category.kind,
    },
  };
}

export async function deleteAccountAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const accountId = String(formData.get("accountId") ?? "");
  const mode = String(formData.get("mode") ?? "writeoff");
  const targetAccountId = String(formData.get("targetAccountId") ?? "");

  if (!accountId) {
    return { error: "Счёт не найден" };
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, wallet: { userId: user.id } },
    include: { wallet: true },
  });

  if (!account) {
    return { error: "Счёт не найден" };
  }

  if (mode === "transfer" && !targetAccountId) {
    return { error: "Выберите счёт для перевода" };
  }

  if (mode === "transfer" && targetAccountId === account.id) {
    return { error: "Счета должны отличаться" };
  }

  if (mode === "transfer") {
    const targetAccount = await prisma.account.findFirst({
      where: {
        id: targetAccountId,
        walletId: account.walletId,
        isArchived: false,
      },
    });

    if (!targetAccount) {
      return { error: "Счёт перевода не найден" };
    }
  }

  await prisma.$transaction(async (tx) => {
    if (Number(account.currentBalance) > 0) {
      if (mode === "transfer") {
        await tx.transaction.create({
          data: {
            walletId: account.walletId,
            sourceAccountId: account.id,
            destinationAccountId: targetAccountId,
            type: "TRANSFER",
            amount: account.currentBalance,
            note: `Перевод остатка со счёта «${account.name}»`,
            transactionDate: new Date(),
            affectsCapital: false,
          },
        });
      } else {
        await tx.transaction.create({
          data: {
            walletId: account.walletId,
            sourceAccountId: account.id,
            type: "EXPENSE",
            amount: account.currentBalance,
            note: `Списание остатка при удалении счёта «${account.name}»`,
            transactionDate: new Date(),
            affectsCapital: true,
          },
        });
      }
    }

    await refreshWalletBalances(tx, account.walletId);

    await tx.account.update({
      where: { id: account.id },
      data: { isArchived: true, currentBalance: new Prisma.Decimal(0) },
    });

    await refreshWalletBalances(tx, account.walletId);
    await refreshForecastSnapshots(tx, user.id);
  });

  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/settings/wallet");
  revalidatePath("/analytics");
  redirect("/accounts");
}

export async function updateAccountNameAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const accountId = String(formData.get("accountId") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!accountId) {
    return { error: "Счёт не найден" };
  }

  if (name.length < 2) {
    return { error: "Введите название счёта" };
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, wallet: { userId: user.id } },
  });

  if (!account) {
    return { error: "Счёт не найден" };
  }

  await prisma.account.update({
    where: { id: account.id },
    data: { name },
  });

  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath(`/accounts/${account.id}`);
  revalidatePath("/settings/wallet");
  return { success: "Название счёта обновлено" };
}
