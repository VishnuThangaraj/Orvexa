-- CreateTable
CREATE TABLE "user_dashboard_preferences" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "widget_order" JSONB NOT NULL DEFAULT '["mail","chat","calendar","meet","drive","tasks","activity"]',
    "hidden_widgets" JSONB NOT NULL DEFAULT '[]',
    "collapsed_widgets" JSONB NOT NULL DEFAULT '[]',
    "summary_strip" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_dashboard_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_dashboard_preferences_user_id_key" ON "user_dashboard_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "user_dashboard_preferences" ADD CONSTRAINT "user_dashboard_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
