-- CreateTable
CREATE TABLE "ChapterAudioAttachment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isRecorded" BOOLEAN NOT NULL DEFAULT false,
    "chapterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterAudioAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChapterAudioAttachment_chapterId_idx" ON "ChapterAudioAttachment"("chapterId");

-- AddForeignKey
ALTER TABLE "ChapterAudioAttachment" ADD CONSTRAINT "ChapterAudioAttachment_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
