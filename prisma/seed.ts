import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SYSTEM_OTHER_CATEGORY_NAME } from "../lib/data-access/categories";

const prisma = new PrismaClient();

const SYSTEM_OTHER_CATEGORY_ID = "seed-system-category-other";
function isTruthy(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

async function main() {
  await prisma.expenseCategory.upsert({
    where: { id: SYSTEM_OTHER_CATEGORY_ID },
    update: {
      name: SYSTEM_OTHER_CATEGORY_NAME,
      isSystem: true,
      isArchived: false,
      userId: null,
    },
    create: {
      id: SYSTEM_OTHER_CATEGORY_ID,
      userId: null,
      name: SYSTEM_OTHER_CATEGORY_NAME,
      isSystem: true,
      isArchived: false,
    },
  });

  // Optional dev seed account (disabled by default for production safety).
  if (isTruthy(process.env.SEED_DEMO_USER)) {
    const demoEmail = (process.env.DEMO_USER_EMAIL ?? "").trim().toLowerCase();
    const demoPassword = process.env.DEMO_USER_PASSWORD ?? "";
    if (!demoEmail || !demoPassword) {
      throw new Error("SEED_DEMO_USER=true requires DEMO_USER_EMAIL and DEMO_USER_PASSWORD");
    }
    const demoPasswordHash = await bcrypt.hash(demoPassword, 12);

    const user = await prisma.user.upsert({
      where: { email: demoEmail },
      update: {
        passwordHash: demoPasswordHash,
        name: "Demo User",
      },
      create: {
        email: demoEmail,
        passwordHash: demoPasswordHash,
        name: "Demo User",
      },
    });

    // Keep demo account clean and predictable.
    await prisma.$transaction([
      prisma.expense.deleteMany({ where: { userId: user.id } }),
      prisma.monthlyBudget.deleteMany({ where: { userId: user.id } }),
      prisma.notificationSettings.deleteMany({ where: { userId: user.id } }),
      prisma.expenseCategory.deleteMany({ where: { userId: user.id } }),
      prisma.notificationSettings.create({
        data: {
          userId: user.id,
          dailyReminderEnabled: false,
          dailyReminderTime: "20:00",
        },
      }),
    ]);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
