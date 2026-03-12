-- AlterTable
ALTER TABLE "VehicleProfile"
ADD COLUMN "routineServiceIntervalKm" DECIMAL(10,2),
ADD COLUMN "routineServiceCost" DECIMAL(10,2),
ADD COLUMN "majorServiceIntervalKm" DECIMAL(10,2),
ADD COLUMN "majorServiceCost" DECIMAL(10,2),
ADD COLUMN "tireReplacementIntervalKm" DECIMAL(10,2),
ADD COLUMN "tireReplacementCost" DECIMAL(10,2),
ADD COLUMN "purchasePrice" DECIMAL(10,2),
ADD COLUMN "resaleValue" DECIMAL(10,2),
ADD COLUMN "expectedLifecycleKm" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'business',
    "cadence" TEXT NOT NULL DEFAULT 'monthly',
    "defaultAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Expense"
ADD COLUMN "categoryId" INTEGER;

-- Backfill recurring expense categories from legacy fixed costs
INSERT INTO "ExpenseCategory" ("userId", "name", "scope", "cadence", "defaultAmount", "createdAt", "updatedAt")
SELECT "userId", 'Insurance', 'business', 'monthly', "insuranceMonthly"::DECIMAL(10,2), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "FixedCost"
WHERE "insuranceMonthly" > 0;

INSERT INTO "ExpenseCategory" ("userId", "name", "scope", "cadence", "defaultAmount", "createdAt", "updatedAt")
SELECT "userId", 'Phone / Data', 'business', 'monthly', "phoneMonthly"::DECIMAL(10,2), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "FixedCost"
WHERE "phoneMonthly" > 0;

INSERT INTO "ExpenseCategory" ("userId", "name", "scope", "cadence", "defaultAmount", "createdAt", "updatedAt")
SELECT "userId", 'Accountant', 'business', 'monthly', "accountantMonthly"::DECIMAL(10,2), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "FixedCost"
WHERE "accountantMonthly" > 0;

INSERT INTO "ExpenseCategory" ("userId", "name", "scope", "cadence", "defaultAmount", "createdAt", "updatedAt")
SELECT "userId", 'Road tax', 'business', 'monthly', "roadTaxMonthly"::DECIMAL(10,2), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "FixedCost"
WHERE "roadTaxMonthly" > 0;

INSERT INTO "ExpenseCategory" ("userId", "name", "scope", "cadence", "defaultAmount", "createdAt", "updatedAt")
SELECT "userId", 'KTEO', 'business', 'monthly', "kteoMonthly"::DECIMAL(10,2), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "FixedCost"
WHERE "kteoMonthly" > 0;

INSERT INTO "ExpenseCategory" ("userId", "name", "scope", "cadence", "defaultAmount", "createdAt", "updatedAt")
SELECT "userId", 'Other recurring', 'business', 'monthly', "otherMonthly"::DECIMAL(10,2), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "FixedCost"
WHERE "otherMonthly" > 0;

-- CreateIndex
CREATE INDEX "ExpenseCategory_userId_idx" ON "ExpenseCategory"("userId");
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
