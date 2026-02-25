-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'SELECTED', 'REJECTED', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "company_logo" TEXT,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "job_type" "JobType" NOT NULL,
    "work_mode" "WorkMode" NOT NULL,
    "min_cgpa" DOUBLE PRECISION,
    "allowed_branches" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eligible_batch" TEXT,
    "max_backlogs" INTEGER DEFAULT 0,
    "salary" TEXT,
    "min_salary" DOUBLE PRECISION,
    "max_salary" DOUBLE PRECISION,
    "required_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferred_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deadline" TIMESTAMP(3),
    "start_date" TIMESTAMP(3),
    "no_of_positions" INTEGER DEFAULT 1,
    "status" "JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "posted_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interview_date" TIMESTAMP(3),
    "interview_feedback" TEXT,
    "offer_letter" TEXT,
    "offered_salary" DOUBLE PRECISION,
    "joining_date" TIMESTAMP(3),
    "cover_letter" TEXT,
    "resume_used" TEXT,
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "applications_job_id_user_id_key" ON "applications"("job_id", "user_id");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
