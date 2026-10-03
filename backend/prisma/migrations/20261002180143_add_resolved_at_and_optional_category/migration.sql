-- DropForeignKey
ALTER TABLE "Grievance" DROP CONSTRAINT "Grievance_categoryId_fkey";

-- AlterTable
ALTER TABLE "Grievance" ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
