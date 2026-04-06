import * as k8s from "@kubernetes/client-node";
import { Router } from "express";
import type { PrismaClient } from "@prisma/client";

/**
 * Shape of the normalized spend response returned by the control-plane API.
 */
interface SpendResponse
{
  source: "litellm" | "local";
  tenantName: string;
  endpoint: string;
  totalCostUsd: number;
  remainingBudgetUsd: number | null;
  monthlyBudgetUsd: number | null;
  topModels: Array<{
    model: string;
    costUsd: number;
    requests: number;
  }>;
  raw: unknown;
}

/**
 * Router for AI spend control and budget management.
 */
export function aiBudgetRouter(coreApi: k8s.CoreV1Api, prisma: PrismaClient): Router
{
  const router = Router();
  const namespace = process.env.NAMESPACE ?? "default";

  /** Returns global monthly spend ceiling. */
  router.get("/global", async function _getGlobalBudget(req, res)
  {
    const item = await prisma.globalBudgetSetting.findUnique({ where: { id: 1 } });

    if (!item)
    {
      res.json({ currency: "USD", ceilingAmount: 0 });
      return;
    }

    res.json({ currency: item.currency, ceilingAmount: Number(item.ceilingAmount) });
  });

  /** Updates the global monthly spend ceiling. */
  router.put("/global", async function _putGlobalBudget(req, res)
  {
    const currency = String(req.body.currency ?? "USD").toUpperCase();
    const ceilingAmount = Number(req.body.ceilingAmount ?? 0);

    await prisma.globalBudgetSetting.upsert({
      where: { id: 1 },
      update: { currency, ceilingAmount },
      create: { id: 1, currency, ceilingAmount },
    });

    res.status(204).send();
  });

  /** Returns all per-account monthly spend ceilings. */
  router.get("/accounts", async function _getAccountBudgets(req, res)
  {
    const accounts = await prisma.accountBudgetSetting.findMany({ orderBy: { userId: "asc" } });

    res.json(accounts.map(function _mapAccount(item)
    {
      return {
        userId: item.userId,
        currency: item.currency,
        ceilingAmount: Number(item.ceilingAmount),
      };
    }));
  });

  /** Creates or updates the budget ceiling for a specific account. */
  router.put("/accounts/:userId", async function _putAccountBudget(req, res)
  {
    const userId = req.params.userId;
    const currency = String(req.body.currency ?? "USD").toUpperCase();
    const ceilingAmount = Number(req.body.ceilingAmount ?? 0);

    await prisma.accountBudgetSetting.upsert({
      where: { userId },
      update: { currency, ceilingAmount },
      create: { userId, currency, ceilingAmount },
    });

    res.status(204).send();
  });

  /** Deletes a per-account spend ceiling. */
  router.delete("/accounts/:userId", async function _deleteAccountBudget(req, res)
  {
    const userId = req.params.userId;
    await prisma.accountBudgetSetting.deleteMany({ where: { userId } });
    res.status(204).send();
  });

  /** Returns a tenant spend summary sourced from LiteLLM usage APIs. */
  router.get("/:tenantName/spend", async function _getTenantSpend(req, res)
  {
    const tenantName = req.params.tenantName;
    const endpoint = process.env.LITELLM_ENDPOINT ?? "http://litellm:4000";
    const masterKey = process.env.LITELLM_MASTER_KEY ?? "";
    const pathTemplate = process.env.LITELLM_SPEND_PATH_TEMPLATE ?? "/spend/tenant/{tenant}";

    if (!masterKey)
    {
      res.status(503).json({ error: "LITELLM_MASTER_KEY is not configured" });
      return;
    }

    const tenant = await prisma.tenant.findUnique({ where: { name: tenantName } });
    if (!tenant)
    {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const requestPath = pathTemplate.replace("{tenant}", encodeURIComponent(tenantName));
    const requestUrl = `${endpoint}${requestPath}`;

    try
    {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${masterKey}`,
        },
      });

      if (!response.ok)
      {
        throw new Error(`LiteLLM spend request failed (${response.status}): ${await response.text()}`);
      }

      const payload = await response.json() as Record<string, unknown>;
      const totalCostUsd = _pickNumber(payload, ["total_cost", "totalCost", "cost", "spend"], 0) ?? 0;
      const monthlyBudgetUsd = _pickNumber(payload, ["max_budget", "monthly_budget", "budget"], null);
      const remainingBudgetUsd = monthlyBudgetUsd !== null ? Math.max(0, monthlyBudgetUsd - totalCostUsd) : null;
      const topModels = _extractTopModels(payload);

      const result: SpendResponse = {
        source: "litellm",
        tenantName,
        endpoint,
        totalCostUsd,
        remainingBudgetUsd,
        monthlyBudgetUsd,
        topModels,
        raw: payload,
      };

      res.json(result);
      return;
    }
    catch (err)
    {
      const fallback = await _buildLocalSpendFallback(prisma, tenantName, err);
      res.json(fallback);
    }
  });

  /** Returns persisted or syncable LiteLLM key metadata for a tenant. */
  router.get("/:tenantName/litellm-key", async function _getLiteLlmKey(req, res)
  {
    const tenantName = req.params.tenantName;
    const tenant = await prisma.tenant.findUnique({ where: { name: tenantName } });

    if (!tenant)
    {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const secret = await _readLiteLlmKeySecret(coreApi, tenantName, namespace);
    if (secret)
    {
      await _syncLiteLlmKeyMetadata(prisma, tenantName, secret);
    }

    const key = await prisma.tenantLiteLlmKey.findFirst({
      where: { tenant: tenantName },
      orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
    });

    if (!key)
    {
      res.status(404).json({ error: "LiteLLM key metadata not found" });
      return;
    }

    res.json({
      tenant: key.tenant,
      keyAlias: key.keyAlias,
      secretName: key.secretName,
      monthlyBudgetUsd: key.monthlyBudgetUsd !== null ? Number(key.monthlyBudgetUsd) : null,
      issuedAt: key.issuedAt.toISOString(),
      revokedAt: key.revokedAt?.toISOString() ?? null,
    });
  });

  /** Revokes the active LiteLLM key for a tenant by deleting the mounted Secret and auditing the action. */
  router.post("/:tenantName/litellm-key/revoke", async function _revokeLiteLlmKey(req, res)
  {
    const tenantName = req.params.tenantName;
    const tenant = await prisma.tenant.findUnique({ where: { name: tenantName } });

    if (!tenant)
    {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const secret = await _readLiteLlmKeySecret(coreApi, tenantName, namespace);
    if (secret)
    {
      await _syncLiteLlmKeyMetadata(prisma, tenantName, secret);
    }

    const secretName = _buildLiteLlmSecretName(tenantName);
    let secretDeleted = false;

    try
    {
      await coreApi.deleteNamespacedSecret({ name: secretName, namespace });
      secretDeleted = true;
    }
    catch
    {
      secretDeleted = false;
    }

    await prisma.tenantLiteLlmKey.updateMany({
      where: { tenant: tenantName, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await prisma.auditEntry.create({
      data: {
        tenant: tenantName,
        action: "LiteLLMKeyRevoked",
        resource: `Tenant/${tenantName}`,
        message: `LiteLLM key revoked for tenant ${tenantName}`,
        metadata: { secretDeleted, secretName },
      },
    });

    res.json({ name: tenantName, status: "revoked", secretDeleted });
  });

  return router;
}

/** Build the canonical Secret name for a tenant LiteLLM key. */
function _buildLiteLlmSecretName(tenantName: string): string
{
  return `openclaw-${tenantName}-litellm-key`;
}

/** Read the tenant LiteLLM key Secret if it exists. */
async function _readLiteLlmKeySecret(coreApi: k8s.CoreV1Api, tenantName: string, namespace: string): Promise<k8s.V1Secret | null>
{
  try
  {
    const response = await coreApi.readNamespacedSecret({ name: _buildLiteLlmSecretName(tenantName), namespace });
    return response;
  }
  catch
  {
    return null;
  }
}

/** Sync Secret annotations into the TenantLiteLlmKey metadata table. */
async function _syncLiteLlmKeyMetadata(prisma: PrismaClient, tenantName: string, secret: k8s.V1Secret): Promise<void>
{
  const annotations = secret.metadata?.annotations ?? {};
  const keyAlias = annotations["opencrane.io/litellm-key-alias"];
  const issuedAtRaw = annotations["opencrane.io/litellm-issued-at"];
  const budgetRaw = annotations["opencrane.io/litellm-monthly-budget-usd"];
  const secretName = secret.metadata?.name;

  if (!keyAlias || !issuedAtRaw || !secretName)
  {
    return;
  }

  const issuedAt = new Date(issuedAtRaw);
  if (Number.isNaN(issuedAt.getTime()))
  {
    return;
  }

  const existing = await prisma.tenantLiteLlmKey.findFirst({
    where: {
      tenant: tenantName,
      keyAlias,
      secretName,
      issuedAt,
    },
  });

  if (existing)
  {
    return;
  }

  await prisma.tenantLiteLlmKey.create({
    data: {
      tenant: tenantName,
      keyAlias,
      secretName,
      issuedAt,
      monthlyBudgetUsd: budgetRaw !== undefined ? Number(budgetRaw) : undefined,
    },
  });
}

/** Build a spend response from local database shadow tables when LiteLLM is unavailable. */
async function _buildLocalSpendFallback(prisma: PrismaClient, tenantName: string, cause: unknown): Promise<SpendResponse>
{
  const usage = await prisma.tokenUsageSnapshot.findUnique({
    where: {
      userId_currency: {
        userId: tenantName,
        currency: "USD",
      },
    },
  });

  const accountBudget = await prisma.accountBudgetSetting.findUnique({ where: { userId: tenantName } });
  const globalBudget = await prisma.globalBudgetSetting.findUnique({ where: { id: 1 } });

  const monthlyBudgetUsd = accountBudget && accountBudget.currency === "USD"
    ? Number(accountBudget.ceilingAmount)
    : globalBudget && globalBudget.currency === "USD"
      ? Number(globalBudget.ceilingAmount)
      : null;

  const totalCostUsd = usage ? Number(usage.totalCost) : 0;
  const remainingBudgetUsd = monthlyBudgetUsd !== null ? Math.max(0, monthlyBudgetUsd - totalCostUsd) : null;

  return {
    source: "local",
    tenantName,
    endpoint: "local://token-usage-snapshots",
    totalCostUsd,
    remainingBudgetUsd,
    monthlyBudgetUsd,
    topModels: [],
    raw: {
      reason: cause instanceof Error ? cause.message : String(cause),
      usage,
      accountBudget,
      globalBudget,
    },
  };
}

/** Pick the first numeric property found from a list of candidate keys. */
function _pickNumber(payload: Record<string, unknown>, keys: string[], fallback: number | null): number | null
{
  for (const key of keys)
  {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value))
    {
      return value;
    }
  }

  return fallback;
}

/** Extract a normalized top-model spend list from common LiteLLM response shapes. */
function _extractTopModels(payload: Record<string, unknown>): SpendResponse["topModels"]
{
  const source = payload.top_models ?? payload.models ?? payload.model_breakdown;
  if (!Array.isArray(source))
  {
    return [];
  }

  return source.map(function _mapModel(row)
  {
    const item = row as Record<string, unknown>;
    return {
      model: String(item.model ?? item.name ?? "unknown"),
      costUsd: typeof item.cost === "number"
        ? item.cost
        : typeof item.total_cost === "number"
          ? item.total_cost
          : 0,
      requests: typeof item.requests === "number"
        ? item.requests
        : typeof item.count === "number"
          ? item.count
          : 0,
    };
  }).sort(function _sortByCost(a, b)
  {
    return b.costUsd - a.costUsd;
  });
}