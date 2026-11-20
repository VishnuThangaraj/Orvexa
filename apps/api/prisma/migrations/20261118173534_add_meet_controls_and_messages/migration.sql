-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "allow_chat" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allow_reactions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allow_screen_share" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "require_approval" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "meeting_messages" (
    "id" BIGSERIAL NOT NULL,
    "meeting_id" BIGINT NOT NULL,
    "sender_id" BIGINT,
    "sender_name" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_messages_meeting_id_created_at_idx" ON "meeting_messages"("meeting_id", "created_at");

-- AddForeignKey
ALTER TABLE "meeting_messages" ADD CONSTRAINT "meeting_messages_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_messages" ADD CONSTRAINT "meeting_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
