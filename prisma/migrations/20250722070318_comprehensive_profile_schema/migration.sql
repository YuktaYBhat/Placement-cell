/*
  Warnings:

  - The values [OTHER,PREFER_NOT_TO_SAY] on the enum `Gender` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `all_semester_marks_cards` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `diploma_marks` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `diploma_marks_card` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `diploma_stream` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `diploma_year` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `father_phone` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `mother_phone` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `tenth_marks` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `tenth_year` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `twelfth_marks` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `twelfth_year` on the `profiles` table. All the data in the column will be lost.
  - The `blood_group` column on the `profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tenth_board` column on the `profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `twelfth_board` column on the `profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');

-- CreateEnum
CREATE TYPE "CasteCategory" AS ENUM ('GEN', 'OBC', 'SC', 'ST');

-- CreateEnum
CREATE TYPE "Board" AS ENUM ('STATE', 'CBSE', 'ICSE');

-- CreateEnum
CREATE TYPE "MarksType" AS ENUM ('PERCENTAGE', 'SUBJECTS_TOTAL', 'OUT_OF_1000');

-- CreateEnum
CREATE TYPE "EngineeringBranch" AS ENUM ('CSE', 'ISE', 'ECE', 'EEE', 'ME', 'CE', 'AIML', 'DS');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('REGULAR', 'LATERAL');

-- CreateEnum
CREATE TYPE "SeatCategory" AS ENUM ('KCET', 'MANAGEMENT', 'COMEDK');

-- CreateEnum
CREATE TYPE "ResidencyStatus" AS ENUM ('HOSTELITE', 'LOCALITE');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('COLLEGE_BUS', 'PRIVATE_TRANSPORT', 'PUBLIC_TRANSPORT', 'WALKING');

-- AlterEnum
BEGIN;
CREATE TYPE "Gender_new" AS ENUM ('MALE', 'FEMALE');
ALTER TABLE "profiles" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TYPE "Gender" RENAME TO "Gender_old";
ALTER TYPE "Gender_new" RENAME TO "Gender";
DROP TYPE "Gender_old";
COMMIT;

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "all_semester_marks_cards",
DROP COLUMN "diploma_marks",
DROP COLUMN "diploma_marks_card",
DROP COLUMN "diploma_stream",
DROP COLUMN "diploma_year",
DROP COLUMN "father_phone",
DROP COLUMN "mother_phone",
DROP COLUMN "tenth_marks",
DROP COLUMN "tenth_year",
DROP COLUMN "twelfth_marks",
DROP COLUMN "twelfth_year",
ADD COLUMN     "active_backlogs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "alternative_mobile" TEXT,
ADD COLUMN     "backlog_subjects" JSONB,
ADD COLUMN     "branch" "EngineeringBranch",
ADD COLUMN     "branch_mentor_name" TEXT,
ADD COLUMN     "bus_route" TEXT,
ADD COLUMN     "calling_mobile" TEXT,
ADD COLUMN     "caste_category" "CasteCategory",
ADD COLUMN     "cleared_after_failure" JSONB,
ADD COLUMN     "college_district" TEXT DEFAULT 'DHARWAD',
ADD COLUMN     "college_name" TEXT DEFAULT 'SDMCET',
ADD COLUMN     "college_pincode" TEXT DEFAULT '580002',
ADD COLUMN     "country" TEXT DEFAULT 'INDIA',
ADD COLUMN     "diploma_area_location" TEXT,
ADD COLUMN     "diploma_certificate" TEXT,
ADD COLUMN     "diploma_college_name" TEXT,
ADD COLUMN     "diploma_percentage" DOUBLE PRECISION,
ADD COLUMN     "diploma_semester_sgpa" JSONB,
ADD COLUMN     "diploma_year_marks" JSONB,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "entry_type" "EntryType",
ADD COLUMN     "failed_subjects" JSONB,
ADD COLUMN     "father_deceased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "father_email" TEXT,
ADD COLUMN     "father_mobile" TEXT,
ADD COLUMN     "final_cgpa" DOUBLE PRECISION,
ADD COLUMN     "floor_number" TEXT,
ADD COLUMN     "has_completed_diploma" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_completed_twelfth" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hostel_name" TEXT,
ADD COLUMN     "library_id" TEXT,
ADD COLUMN     "local_city" TEXT,
ADD COLUMN     "middle_name" TEXT,
ADD COLUMN     "mother_deceased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mother_email" TEXT,
ADD COLUMN     "mother_mobile" TEXT,
ADD COLUMN     "nationality" TEXT DEFAULT 'INDIAN',
ADD COLUMN     "residency_status" "ResidencyStatus",
ADD COLUMN     "room_number" TEXT,
ADD COLUMN     "seat_category" "SeatCategory",
ADD COLUMN     "semester_marks_cards" JSONB,
ADD COLUMN     "semester_records" JSONB,
ADD COLUMN     "state_of_domicile" TEXT,
ADD COLUMN     "tenth_area_district_city" TEXT,
ADD COLUMN     "tenth_marks_out_of_1000" INTEGER,
ADD COLUMN     "tenth_marks_type" "MarksType",
ADD COLUMN     "tenth_passing_month" INTEGER,
ADD COLUMN     "tenth_passing_year" INTEGER,
ADD COLUMN     "tenth_percentage" DOUBLE PRECISION,
ADD COLUMN     "tenth_pincode" TEXT,
ADD COLUMN     "tenth_school_name" TEXT,
ADD COLUMN     "tenth_state" TEXT,
ADD COLUMN     "tenth_subjects" INTEGER,
ADD COLUMN     "tenth_total_marks" INTEGER,
ADD COLUMN     "transport_mode" "TransportMode",
ADD COLUMN     "twelfth_area_district_city" TEXT,
ADD COLUMN     "twelfth_marks_out_of_1000" INTEGER,
ADD COLUMN     "twelfth_marks_type" "MarksType",
ADD COLUMN     "twelfth_passing_month" INTEGER,
ADD COLUMN     "twelfth_passing_year" INTEGER,
ADD COLUMN     "twelfth_percentage" DOUBLE PRECISION,
ADD COLUMN     "twelfth_pincode" TEXT,
ADD COLUMN     "twelfth_school_name" TEXT,
ADD COLUMN     "twelfth_state" TEXT,
ADD COLUMN     "twelfth_subjects" INTEGER,
ADD COLUMN     "twelfth_total_marks" INTEGER,
ADD COLUMN     "whatsapp_mobile" TEXT,
DROP COLUMN "blood_group",
ADD COLUMN     "blood_group" "BloodGroup",
DROP COLUMN "tenth_board",
ADD COLUMN     "tenth_board" "Board",
DROP COLUMN "twelfth_board",
ADD COLUMN     "twelfth_board" "Board";
