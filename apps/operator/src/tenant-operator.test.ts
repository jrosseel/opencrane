import { describe, it, expect } from "vitest";

import type { Tenant, OperatorConfig } from "./types.js";
import { buildBucketClaim } from "./storage-provider.js";

/** Default operator config used across all test cases. */
const defaultConfig: OperatorConfig = {
  watchNamespace: "default",
  tenantDefaultImage: "ghcr.io/opencrane/tenant:latest",
  ingressDomain: "opencrane.local",
  ingressClassName: "nginx",
  sharedSkillsPvcName: "opencrane-shared-skills",
  gatewayPort: 18789,
  storageProvider: "gcs",
  bucketPrefix: "opencrane",
  gcpProject: "my-gcp-project",
  csiDriver: "gcsfuse.csi.storage.gke.io",
  crossplaneEnabled: true,
};

/**
 * Create a minimal Tenant fixture with the given name and optional
 * spec overrides for use in unit tests.
 */
function _makeTenant(name: string, overrides?: Partial<Tenant["spec"]>): Tenant
{
  return {
    apiVersion: "opencrane.io/v1alpha1",
    kind: "Tenant",
    metadata: { name, namespace: "default" },
    spec: {
      displayName: name.charAt(0).toUpperCase() + name.slice(1),
      email: `${name}@example.com`,
      ...overrides,
    },
  };
}

describe("TenantOperator", () =>
{
  it("builds correct resource names from tenant name", () =>
  {
    const tenant = _makeTenant("jente");
    const name = tenant.metadata!.name;

    expect(`openclaw-${name}`).toBe("openclaw-jente");
    expect(`openclaw-${name}-config`).toBe("openclaw-jente-config");
    expect(`openclaw-${name}-encryption-key`).toBe("openclaw-jente-encryption-key");
    expect(`openclaw-${name}-bucket`).toBe("openclaw-jente-bucket");
  });

  it("generates correct ingress host", () =>
  {
    const tenant = _makeTenant("sarah");
    const host = `${tenant.metadata!.name}.${defaultConfig.ingressDomain}`;

    expect(host).toBe("sarah.opencrane.local");
  });

  it("respects custom image override", () =>
  {
    const tenant = _makeTenant("mike", {
      openclawImage: "custom-registry/openclaw:v2",
    });

    const image = tenant.spec.openclawImage ?? defaultConfig.tenantDefaultImage;
    expect(image).toBe("custom-registry/openclaw:v2");
  });

  it("falls back to default image when no override", () =>
  {
    const tenant = _makeTenant("anna");

    const image = tenant.spec.openclawImage ?? defaultConfig.tenantDefaultImage;
    expect(image).toBe("ghcr.io/opencrane/tenant:latest");
  });

  it("detects suspended tenants", () =>
  {
    const active = _makeTenant("active");
    const suspended = _makeTenant("paused", { suspended: true });

    expect(active.spec.suspended).toBeFalsy();
    expect(suspended.spec.suspended).toBe(true);
  });

  it("merges config overrides", () =>
  {
    const tenant = _makeTenant("custom", {
      configOverrides: {
        agents: { defaults: { thinking: "high" } },
      },
    });

    const baseConfig = {
      gateway: { mode: "local", port: 18789, bind: "lan" },
      agents: { defaults: { thinking: "medium" } },
    };

    const merged = tenant.spec.configOverrides
      ? { ...baseConfig, ...tenant.spec.configOverrides }
      : baseConfig;

    expect(merged.agents).toEqual({ defaults: { thinking: "high" } });
  });

  it("supports openclawVersion on tenant spec", () =>
  {
    const tenant = _makeTenant("versioned", { openclawVersion: "2026.3.15" });
    expect(tenant.spec.openclawVersion).toBe("2026.3.15");
  });

  it("defaults openclawVersion to latest when not set", () =>
  {
    const tenant = _makeTenant("default-version");
    const version = tenant.spec.openclawVersion ?? "latest";
    expect(version).toBe("latest");
  });
});

describe("StorageProvider", () =>
{
  it("builds bucket claim with correct name and prefix", () =>
  {
    const claim = buildBucketClaim("jente", "default", "opencrane");

    expect(claim.metadata?.name).toBe("openclaw-jente-bucket");
    expect((claim as Record<string, unknown>).spec).toEqual({
      bucketName: "opencrane-jente",
      tenantName: "jente",
    });
  });

  it("includes tenant label on bucket claim", () =>
  {
    const claim = buildBucketClaim("sarah", "default", "myprefix");

    expect(claim.metadata?.labels?.["opencrane.io/tenant"]).toBe("sarah");
  });

  it("generates correct GCS bucket name from prefix and tenant", () =>
  {
    const claim = buildBucketClaim("mike", "prod", "acme-ai");
    const spec = (claim as Record<string, unknown>).spec as Record<string, unknown>;

    expect(spec.bucketName).toBe("acme-ai-mike");
  });
});

describe("ServiceAccount (Workload Identity)", () =>
{
  it("generates correct GCP service account annotation", () =>
  {
    const name = "jente";
    const project = defaultConfig.gcpProject;
    const expected = `opencrane-${name}@${project}.iam.gserviceaccount.com`;

    expect(expected).toBe("opencrane-jente@my-gcp-project.iam.gserviceaccount.com");
  });
});
