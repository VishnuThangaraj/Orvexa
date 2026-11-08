-- DropForeignKey
ALTER TABLE "organization_settings" DROP CONSTRAINT "organization_settings_logo_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN "username" VARCHAR(100) NOT NULL;

-- DropTable
DROP TABLE "organization_settings";

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
