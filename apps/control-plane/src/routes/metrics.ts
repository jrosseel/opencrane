import { Router } from "express";
import type { PrismaClient } from "@prisma/client";

/**
 * Creates router for infrastructure usage metrics.
 * @param prisma - Prisma ORM client
 * @returns Configured Express router
 */
export function metricsRouter(prisma: PrismaClient): Router
{
  const router = Router();

  /** Returns latest server utilization snapshot for dashboard cards. */
  router.get("/server", async function _serverMetrics(req, res)
  {
    const latest = await prisma.serverMetricSnapshot.findFirst({
      orderBy: { sampledAt: "desc" },
    });

    if (latest)
    {
      res.json({
        cpuPercent: latest.cpuPercent,
        memoryUsedBytes: Number(latest.memoryUsedBytes),
        memoryTotalBytes: Number(latest.memoryTotalBytes),
        storageUsedBytes: Number(latest.storageUsedBytes),
        storageTotalBytes: Number(latest.storageTotalBytes),
        activeTenants: latest.activeTenants,
        sampledAt: latest.sampledAt.toISOString(),
      });
      return;
    }

    const tenantCount = await prisma.tenant.count({ where: { phase: { not: "Suspended" } } });
    res.json({
      cpuPercent: 0,
      memoryUsedBytes: 0,
      memoryTotalBytes: 64 * 1024 * 1024 * 1024,
      storageUsedBytes: 0,
      storageTotalBytes: 1024 * 1024 * 1024 * 1024,
      activeTenants: tenantCount,
      sampledAt: new Date().toISOString(),
    });
  });

  return router;
}
