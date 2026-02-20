-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('FILE_ASSIGNED', 'FILE_STATUS_CHANGED', 'FILE_STAGE_COMPLETED', 'DEADLINE_APPROACHING', 'DEADLINE_OVERDUE', 'COMMENT_ADDED', 'ATTACHMENT_ADDED', 'PRIORITY_SET', 'GENERAL');

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "poi_file_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alerts_user_id_is_read_idx" ON "alerts"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "alerts_created_at_idx" ON "alerts"("created_at");

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_poi_file_id_fkey" FOREIGN KEY ("poi_file_id") REFERENCES "poi_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
