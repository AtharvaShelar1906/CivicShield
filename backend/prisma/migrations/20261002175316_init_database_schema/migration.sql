-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'AUTHORITY', 'ADMIN');

-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CITIZEN',
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grievance" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "status" "GrievanceStatus" NOT NULL DEFAULT 'SUBMITTED',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "categoryId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceAnalysis" (
    "id" TEXT NOT NULL,
    "grievanceId" TEXT NOT NULL,
    "predictedCategory" TEXT NOT NULL,
    "categoryConfidence" DOUBLE PRECISION NOT NULL,
    "severityScore" DOUBLE PRECISION NOT NULL,
    "predictedPriority" "Priority" NOT NULL,
    "isAnomalous" BOOLEAN NOT NULL DEFAULT false,
    "anomalyReason" TEXT,
    "modelVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrievanceAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceSimilarity" (
    "id" TEXT NOT NULL,
    "sourceGrievanceId" TEXT NOT NULL,
    "targetGrievanceId" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrievanceSimilarity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Grievance_status_idx" ON "Grievance"("status");

-- CreateIndex
CREATE INDEX "Grievance_priority_idx" ON "Grievance"("priority");

-- CreateIndex
CREATE INDEX "Grievance_categoryId_idx" ON "Grievance"("categoryId");

-- CreateIndex
CREATE INDEX "Grievance_submittedById_idx" ON "Grievance"("submittedById");

-- CreateIndex
CREATE INDEX "Grievance_assignedToId_idx" ON "Grievance"("assignedToId");

-- CreateIndex
CREATE INDEX "Grievance_createdAt_idx" ON "Grievance"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GrievanceAnalysis_grievanceId_key" ON "GrievanceAnalysis"("grievanceId");

-- CreateIndex
CREATE INDEX "GrievanceAnalysis_predictedPriority_idx" ON "GrievanceAnalysis"("predictedPriority");

-- CreateIndex
CREATE INDEX "GrievanceAnalysis_isAnomalous_idx" ON "GrievanceAnalysis"("isAnomalous");

-- CreateIndex
CREATE INDEX "GrievanceAnalysis_createdAt_idx" ON "GrievanceAnalysis"("createdAt");

-- CreateIndex
CREATE INDEX "GrievanceSimilarity_sourceGrievanceId_idx" ON "GrievanceSimilarity"("sourceGrievanceId");

-- CreateIndex
CREATE INDEX "GrievanceSimilarity_targetGrievanceId_idx" ON "GrievanceSimilarity"("targetGrievanceId");

-- CreateIndex
CREATE INDEX "GrievanceSimilarity_similarityScore_idx" ON "GrievanceSimilarity"("similarityScore");

-- CreateIndex
CREATE UNIQUE INDEX "GrievanceSimilarity_sourceGrievanceId_targetGrievanceId_key" ON "GrievanceSimilarity"("sourceGrievanceId", "targetGrievanceId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceAnalysis" ADD CONSTRAINT "GrievanceAnalysis_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceSimilarity" ADD CONSTRAINT "GrievanceSimilarity_sourceGrievanceId_fkey" FOREIGN KEY ("sourceGrievanceId") REFERENCES "Grievance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceSimilarity" ADD CONSTRAINT "GrievanceSimilarity_targetGrievanceId_fkey" FOREIGN KEY ("targetGrievanceId") REFERENCES "Grievance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
