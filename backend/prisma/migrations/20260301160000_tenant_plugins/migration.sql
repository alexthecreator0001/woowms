-- CreateTable
CREATE TABLE "tenant_plugins" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "plugin_key" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "api_key_hash" TEXT,
    "api_key_prefix" TEXT,
    "settings" JSONB DEFAULT '{}',
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_plugins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_plugins_tenant_id_plugin_key_key" ON "tenant_plugins"("tenant_id", "plugin_key");

-- CreateIndex
CREATE INDEX "tenant_plugins_tenant_id_idx" ON "tenant_plugins"("tenant_id");

-- AddForeignKey
ALTER TABLE "tenant_plugins" ADD CONSTRAINT "tenant_plugins_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
