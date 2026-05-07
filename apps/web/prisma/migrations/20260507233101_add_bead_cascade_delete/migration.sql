-- DropForeignKey
ALTER TABLE "Bead" DROP CONSTRAINT "Bead_threadId_fkey";

-- AddForeignKey
ALTER TABLE "Bead" ADD CONSTRAINT "Bead_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
