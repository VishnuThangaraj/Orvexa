-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "client_message_id" VARCHAR(64);

-- CreateIndex
CREATE INDEX "chat_messages_conversation_id_client_message_id_idx" ON "chat_messages"("conversation_id", "client_message_id");
