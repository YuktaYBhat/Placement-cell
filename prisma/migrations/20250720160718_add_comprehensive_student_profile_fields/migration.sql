/*
  Warnings:

  - A unique constraint covering the columns `[usn]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'FREELANCE');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('OFFICE', 'REMOTE', 'HYBRID', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'INCOMPLETE');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "all_semester_marks_cards" JSONB,
ADD COLUMN     "alternate_phone" TEXT,
ADD COLUMN     "blood_group" TEXT,
ADD COLUMN     "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "codechef" TEXT,
ADD COLUMN     "codeforces" TEXT,
ADD COLUMN     "college_code" TEXT,
ADD COLUMN     "college_name" TEXT,
ADD COLUMN     "completion_step" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "current_address" TEXT,
ADD COLUMN     "current_city" TEXT,
ADD COLUMN     "current_pincode" TEXT,
ADD COLUMN     "current_state" TEXT,
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "department" TEXT,
ADD COLUMN     "diploma_marks" DOUBLE PRECISION,
ADD COLUMN     "diploma_marks_card" TEXT,
ADD COLUMN     "diploma_year" INTEGER,
ADD COLUMN     "expected_salary" DOUBLE PRECISION,
ADD COLUMN     "father_name" TEXT,
ADD COLUMN     "father_occupation" TEXT,
ADD COLUMN     "father_phone" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "guardian_name" TEXT,
ADD COLUMN     "guardian_phone" TEXT,
ADD COLUMN     "guardian_relation" TEXT,
ADD COLUMN     "hackerrank" TEXT,
ADD COLUMN     "hobbies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "internships" JSONB,
ADD COLUMN     "is_complete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "job_type" "JobType",
ADD COLUMN     "kyc_status" "KYCStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "leetcode" TEXT,
ADD COLUMN     "mother_name" TEXT,
ADD COLUMN     "mother_occupation" TEXT,
ADD COLUMN     "mother_phone" TEXT,
ADD COLUMN     "percentage" DOUBLE PRECISION,
ADD COLUMN     "permanent_address" TEXT,
ADD COLUMN     "permanent_city" TEXT,
ADD COLUMN     "permanent_pincode" TEXT,
ADD COLUMN     "permanent_state" TEXT,
ADD COLUMN     "preferred_locations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "profile_photo" TEXT,
ADD COLUMN     "projects" JSONB,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "same_as_current" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "semester" INTEGER,
ADD COLUMN     "specialization" TEXT,
ADD COLUMN     "tenth_board" TEXT,
ADD COLUMN     "tenth_marks" DOUBLE PRECISION,
ADD COLUMN     "tenth_marks_card" TEXT,
ADD COLUMN     "tenth_year" INTEGER,
ADD COLUMN     "twelfth_board" TEXT,
ADD COLUMN     "twelfth_marks" DOUBLE PRECISION,
ADD COLUMN     "twelfth_marks_card" TEXT,
ADD COLUMN     "twelfth_year" INTEGER,
ADD COLUMN     "usn" TEXT,
ADD COLUMN     "verified_at" TIMESTAMP(3),
ADD COLUMN     "verified_by" TEXT,
ADD COLUMN     "work_mode" "WorkMode";

-- CreateIndex
CREATE UNIQUE INDEX "profiles_usn_key" ON "profiles"("usn");
