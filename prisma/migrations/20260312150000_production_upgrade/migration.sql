-- AlterTable
ALTER TABLE "User"
ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'el',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Shift"
ADD COLUMN "shiftDate" TIMESTAMP(3),
ADD COLUMN "startTime" TEXT,
ADD COLUMN "endTime" TEXT,
ADD COLUMN "hoursWorked" DOUBLE PRECISION,
ADD COLUMN "ordersCompleted" INTEGER,
ADD COLUMN "kilometersDriven" DOUBLE PRECISION,
ADD COLUMN "baseEarnings" DECIMAL(10,2),
ADD COLUMN "tipsAmount" DECIMAL(10,2),
ADD COLUMN "bonusAmount" DECIMAL(10,2),
ADD COLUMN "fuelExpenseDirect" DECIMAL(10,2),
ADD COLUMN "tollsOrParking" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Shift"
SET
  "shiftDate" = "date",
  "hoursWorked" = "hours",
  "ordersCompleted" = "ordersCount",
  "kilometersDriven" = "kilometers",
  "baseEarnings" = "platformEarnings"::DECIMAL(10,2),
  "tipsAmount" = ("tipsCard" + "tipsCash")::DECIMAL(10,2),
  "bonusAmount" = "bonus"::DECIMAL(10,2),
  "tollsOrParking" = COALESCE("tollsOrParking", 0);

-- CreateTable
CREATE TABLE "VehicleProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "fuelPricePerLiter" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fuelConsumptionPer100Km" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "maintenanceCostPerKm" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "tiresCostPerKm" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "depreciationCostPerKm" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VehicleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "insuranceMonthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "phoneMonthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "accountantMonthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "roadTaxMonthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "kteoMonthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "otherMonthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dailyFixedCost" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CostProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "platformKey" TEXT NOT NULL,
    "feePercent" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fuelPricePerLiter" DECIMAL(10,2),
    "fuelConsumptionPer100Km" DECIMAL(10,2),
    "maintenanceCostPerKm" DECIMAL(10,4),
    "depreciationCostPerKm" DECIMAL(10,4),
    "dailyFixedCost" DECIMAL(10,2),
    "platformFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxReservePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Athens',
    "locale" TEXT NOT NULL DEFAULT 'el',
    "preferredDashboardPeriod" TEXT NOT NULL DEFAULT 'week',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- Backfill canonical profiles from legacy tables
INSERT INTO "VehicleProfile" (
  "userId",
  "vehicleType",
  "fuelType",
  "fuelPricePerLiter",
  "fuelConsumptionPer100Km",
  "maintenanceCostPerKm",
  "tiresCostPerKm",
  "depreciationCostPerKm",
  "createdAt",
  "updatedAt"
)
SELECT
  "userId",
  "vehicleType",
  "fuelType",
  "fuelPrice"::DECIMAL(10,2),
  "consumptionPer100Km"::DECIMAL(10,2),
  "maintenancePerKm"::DECIMAL(10,4),
  "tiresPerKm"::DECIMAL(10,4),
  "depreciationPerKm"::DECIMAL(10,4),
  "createdAt",
  CURRENT_TIMESTAMP
FROM "Vehicle";

INSERT INTO "CostProfile" (
  "userId",
  "insuranceMonthly",
  "phoneMonthly",
  "accountantMonthly",
  "roadTaxMonthly",
  "kteoMonthly",
  "otherMonthly",
  "dailyFixedCost",
  "createdAt",
  "updatedAt"
)
SELECT
  "userId",
  "insuranceMonthly"::DECIMAL(10,2),
  "phoneMonthly"::DECIMAL(10,2),
  "accountantMonthly"::DECIMAL(10,2),
  "roadTaxMonthly"::DECIMAL(10,2),
  "kteoMonthly"::DECIMAL(10,2),
  "otherMonthly"::DECIMAL(10,2),
  (("insuranceMonthly" + "phoneMonthly" + "accountantMonthly" + "roadTaxMonthly" + "kteoMonthly" + "otherMonthly") / 30)::DECIMAL(10,2),
  "createdAt",
  CURRENT_TIMESTAMP
FROM "FixedCost";

INSERT INTO "AppSettings" ("userId", "locale", "createdAt", "updatedAt")
SELECT "id", COALESCE("locale", 'el'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT ("userId") DO NOTHING;

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_userId_key" ON "AppSettings"("userId");

-- AddForeignKey
ALTER TABLE "VehicleProfile" ADD CONSTRAINT "VehicleProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CostProfile" ADD CONSTRAINT "CostProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformProfile" ADD CONSTRAINT "PlatformProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppSettings" ADD CONSTRAINT "AppSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
