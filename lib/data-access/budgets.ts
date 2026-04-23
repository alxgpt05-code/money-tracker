import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export interface CreateMonthlyBudgetInput {
  userId: string;
  year: number;
  month: number;
  amount: number;
}

export async function getMonthlyBudget(userId: string, year: number, month: number) {
  return db.monthlyBudget.findUnique({
    where: {
      userId_year_month: {
        userId,
        year,
        month,
      },
    },
  });
}

export async function checkIfBudgetExists(userId: string, year: number, month: number): Promise<boolean> {
  const count = await db.monthlyBudget.count({
    where: {
      userId,
      year,
      month,
    },
  });

  return count > 0;
}

export async function createMonthlyBudget(input: CreateMonthlyBudgetInput) {
  if (input.month < 1 || input.month > 12) {
    throw new Error("Month must be between 1 and 12");
  }

  if (input.amount <= 0) {
    throw new Error("Budget amount must be greater than zero");
  }

  // Business rule: budget is created once per user+month and then treated as immutable.
  // DB-level guard: @@unique([userId, year, month]).
  // UI/API should open budget modal when record is missing and should not expose edit flow afterwards.
  try {
    return await db.monthlyBudget.create({
      data: {
        userId: input.userId,
        year: input.year,
        month: input.month,
        amount: new Prisma.Decimal(input.amount),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Monthly budget already exists");
    }

    throw error;
  }
}
