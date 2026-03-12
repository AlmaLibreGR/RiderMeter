-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roleType" TEXT NOT NULL DEFAULT 'simple',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "consumptionPer100Km" DOUBLE PRECISION NOT NULL,
    "fuelPrice" DOUBLE PRECISION NOT NULL,
    "maintenancePerKm" DOUBLE PRECISION NOT NULL,
    "tiresPerKm" DOUBLE PRECISION NOT NULL,
    "depreciationPerKm" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedCost" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "insuranceMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "phoneMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accountantMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roadTaxMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kteoMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixedCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "platform" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "ordersCount" INTEGER NOT NULL,
    "kilometers" DOUBLE PRECISION NOT NULL,
    "platformEarnings" DOUBLE PRECISION NOT NULL,
    "tipsCard" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tipsCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedCost" ADD CONSTRAINT "FixedCost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
