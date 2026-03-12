import { prisma } from "@/lib/prisma";
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors";
import { normalizeCadenceToDailyAmount } from "@/lib/calculations";
import { roundCurrency, toSafeNumber } from "@/lib/utils";
import type {
  ExpenseCategorySnapshot,
  ExpenseEntrySnapshot,
  ExpenseScope,
} from "@/types/domain";

export async function listExpenseCategories(userId: number): Promise<ExpenseCategorySnapshot[]> {
  try {
    const categories = await prisma.expenseCategory.findMany({
      where: { userId },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      scope: category.scope as ExpenseScope,
      cadence: category.cadence as ExpenseCategorySnapshot["cadence"],
      defaultAmount: toSafeNumber(category.defaultAmount),
      isActive: category.isActive,
    }));
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return [];
    }

    throw error;
  }
}

export async function replaceExpenseCategories(
  userId: number,
  categories: Array<Omit<ExpenseCategorySnapshot, "id">>
) {
  try {
    await prisma.$transaction([
      prisma.expenseCategory.deleteMany({ where: { userId } }),
      ...categories.map((category) =>
        prisma.expenseCategory.create({
          data: {
            userId,
            name: category.name,
            scope: category.scope,
            cadence: category.cadence,
            defaultAmount: roundCurrency(category.defaultAmount),
            isActive: category.isActive,
          },
        })
      ),
    ]);

    return listExpenseCategories(userId);
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return [];
    }

    throw error;
  }
}

export async function listRecentExpenses(userId: number): Promise<ExpenseEntrySnapshot[]> {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId },
      include: { expenseCategory: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 12,
    });

    return expenses.map((expense) => ({
      id: expense.id,
      categoryId: expense.categoryId,
      category: expense.category,
      amount: toSafeNumber(expense.amount),
      description: expense.description ?? null,
      date: expense.date.toISOString(),
      scope: (expense.expenseCategory?.scope as ExpenseScope | undefined) ?? "business",
    }));
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return [];
    }

    throw error;
  }
}

export async function createExpenseEntry(args: {
  userId: number;
  categoryId?: number | null;
  category?: string;
  amount: number;
  date: string;
  description?: string | null;
}) {
  let linkedCategory:
    | {
        id: number;
        name: string;
        scope: string;
      }
    | null = null;

  if (args.categoryId) {
    try {
      linkedCategory = await prisma.expenseCategory.findFirst({
        where: {
          id: args.categoryId,
          userId: args.userId,
        },
        select: {
          id: true,
          name: true,
          scope: true,
        },
      });
    } catch (error) {
      if (!isPrismaSchemaMismatchError(error)) {
        throw error;
      }
    }
  }

  const categoryName = linkedCategory?.name ?? args.category?.trim() ?? "Expense";
  const created = await prisma.expense.create({
    data: {
      userId: args.userId,
      categoryId: linkedCategory?.id ?? null,
      category: categoryName,
      amount: roundCurrency(args.amount),
      date: new Date(`${args.date}T00:00:00.000Z`),
      description: args.description?.trim() || null,
    },
  });

  return {
    id: created.id,
    categoryId: created.categoryId,
    category: created.category,
    amount: toSafeNumber(created.amount),
    description: created.description ?? null,
    date: created.date.toISOString(),
    scope: (linkedCategory?.scope as ExpenseScope | undefined) ?? "business",
  } satisfies ExpenseEntrySnapshot;
}

export function summarizeRecurringCategories(categories: ExpenseCategorySnapshot[]) {
  const recurringCategories = categories.filter(
    (category) => category.isActive && category.scope === "business" && category.cadence !== "one_time"
  );

  const dailyFixedCost = roundCurrency(
    recurringCategories.reduce(
      (sum, category) => sum + normalizeCadenceToDailyAmount(category.defaultAmount, category.cadence),
      0
    )
  );

  const monthlyEquivalent = roundCurrency(dailyFixedCost * 30);

  return {
    recurringCategories,
    dailyFixedCost,
    monthlyEquivalent,
  };
}
