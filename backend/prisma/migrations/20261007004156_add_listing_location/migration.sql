-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "expectedGraduation" TEXT,
ADD COLUMN     "year" TEXT;
