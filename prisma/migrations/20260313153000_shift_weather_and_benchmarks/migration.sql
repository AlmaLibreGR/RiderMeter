-- AlterTable
ALTER TABLE "Shift"
ADD COLUMN "weatherCondition" TEXT DEFAULT 'unknown';

-- AlterTable
ALTER TABLE "Shift"
ALTER COLUMN "area" DROP NOT NULL;
