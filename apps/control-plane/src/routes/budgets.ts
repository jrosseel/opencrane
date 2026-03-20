import { Router } from "express";
import type { PrismaClient } from "@prisma/client";

/**
 * Creates router for global and per-account budget configuration.
 * @param prisma - Prisma ORM client
 * @returns Configured Express router
 */
export function budgetsRouter(prisma: PrismaClient): Router
{
  const router = Router();

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

  return router;
}
