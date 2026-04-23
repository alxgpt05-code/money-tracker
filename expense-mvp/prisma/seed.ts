import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "продукты", color: "#9FE870" },
  { name: "кафе", color: "#F472B6" },
  { name: "транспорт", color: "#60A5FA" },
  { name: "дом", color: "#F59E0B" },
  { name: "здоровье", color: "#34D399" },
  { name: "развлечения", color: "#A78BFA" },
  { name: "покупки", color: "#FB7185" },
  { name: "другое", color: "#D1D5DB" }
];

async function main() {
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { color: category.color },
      create: category
    });
  }

  const defaultUserId = process.env.DEMO_USER_ID || "demo";
  const defaultPassword = process.env.DEMO_PASSWORD || "demo1234";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const user = await prisma.user.findUnique({ where: { id: defaultUserId } });
  if (!user) {
    const created = await prisma.user.create({
      data: { id: defaultUserId, passwordHash }
    });

    await prisma.notificationSettings.create({
      data: {
        userId: created.id,
        enabled: false,
        time: "22:00",
        timezone: "Europe/Moscow"
      }
    });

    console.log(`Demo user created. ID: ${created.id}. Password: ${defaultPassword}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
