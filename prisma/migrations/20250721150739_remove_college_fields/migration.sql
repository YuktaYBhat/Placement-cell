/*
  Warnings:

  - You are about to drop the column `college` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `college_code` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `college_name` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "college",
DROP COLUMN "college_code",
DROP COLUMN "college_name";
