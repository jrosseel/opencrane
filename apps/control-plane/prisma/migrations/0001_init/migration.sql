-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "tenants" (
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "team" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'Pending',
    "ingress_host" TEXT,
    "config_overrides" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "access_policies" (
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tenant_selector" JSONB,
    "domains" JSONB,
    "egress_rules" JSONB,
    "mcp_servers" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_policies_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "team" TEXT NOT NULL DEFAULT '',
    "path" TEXT NOT NULL,
    "author" TEXT,
    "content_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("name","scope","team")
);

-- CreateTable
CREATE TABLE "server_metric_snapshots" (
    "id" SERIAL NOT NULL,
    "cpu_percent" DOUBLE PRECISION NOT NULL,
    "memory_used_bytes" BIGINT NOT NULL,
    "memory_total_bytes" BIGINT NOT NULL,
    "storage_used_bytes" BIGINT NOT NULL,
    "storage_total_bytes" BIGINT NOT NULL,
    "active_tenants" INTEGER NOT NULL DEFAULT 0,
    "sampled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_usage_snapshots" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "total_cost" DECIMAL(12,4) NOT NULL,
    "sampled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_usage_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_budget_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL,
    "ceiling_amount" DECIMAL(12,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_budget_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_budget_settings" (
    "user_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "ceiling_amount" DECIMAL(12,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_budget_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "access_tokens" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_api_keys" (
    "provider" TEXT NOT NULL,
    "key_value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_api_keys_pkey" PRIMARY KEY ("provider")
);

-- CreateIndex
CREATE INDEX "audit_log_tenant_idx" ON "audit_log"("tenant");

-- CreateIndex
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log"("timestamp");

-- CreateIndex
CREATE INDEX "server_metric_snapshots_sampled_at_idx" ON "server_metric_snapshots"("sampled_at");

-- CreateIndex
CREATE INDEX "token_usage_snapshots_sampled_at_idx" ON "token_usage_snapshots"("sampled_at");

-- CreateIndex
CREATE UNIQUE INDEX "token_usage_snapshots_user_id_currency_key" ON "token_usage_snapshots"("user_id", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "access_tokens_token_hash_key" ON "access_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "access_tokens_owner_idx" ON "access_tokens"("owner");

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_fkey" FOREIGN KEY ("tenant") REFERENCES "tenants"("name") ON DELETE SET NULL ON UPDATE CASCADE;
