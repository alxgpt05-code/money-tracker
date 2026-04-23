import { db } from "@/lib/db";

export const SYSTEM_OTHER_CATEGORY_NAME = "Прочее";

export async function getUserCategories(userId: string) {
  return db.expenseCategory.findMany({
    where: {
      isArchived: false,
      OR: [{ isSystem: true }, { userId }],
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
}

export async function createCategory(userId: string, name: string) {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error("Category name is required");
  }

  if (normalizedName.toLowerCase() === SYSTEM_OTHER_CATEGORY_NAME.toLowerCase()) {
    throw new Error(`Category \"${SYSTEM_OTHER_CATEGORY_NAME}\" already exists as system category`);
  }

  const duplicate = await db.expenseCategory.findFirst({
    where: {
      OR: [
        { userId, name: { equals: normalizedName, mode: "insensitive" } },
        { isSystem: true, name: { equals: normalizedName, mode: "insensitive" } },
      ],
    },
  });

  if (duplicate && !duplicate.isArchived) {
    throw new Error("Category already exists");
  }

  if (duplicate && duplicate.userId === userId && duplicate.isArchived) {
    return db.expenseCategory.update({
      where: { id: duplicate.id },
      data: { isArchived: false },
    });
  }

  return db.expenseCategory.create({
    data: {
      userId,
      name: normalizedName,
      isSystem: false,
    },
  });
}

export async function deleteCategory(categoryId: string) {
  const category = await db.expenseCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  if (category.isSystem) {
    throw new Error("System category cannot be deleted");
  }

  // Business rule: category is soft-deleted (archived), existing expenses keep original categoryId.
  // Archived categories are hidden in /add category picker but still visible in expense history.
  await db.expenseCategory.update({
    where: { id: category.id },
    data: { isArchived: true },
  });
}
