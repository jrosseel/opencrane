# -----------------------------------------------------------------------------
# Crossplane module
#
# Installs Crossplane via Helm and creates a GCP ProviderConfig for
# managing GCP resources from within Kubernetes.
# -----------------------------------------------------------------------------

resource "helm_release" "crossplane"
{
  name             = "crossplane"
  namespace        = "crossplane-system"
  create_namespace = true
  repository       = "https://charts.crossplane.io/stable"
  chart            = "crossplane"
  version          = "1.15.0"
  wait             = true
  timeout          = 600

  set
  {
    name  = "args"
    value = "{--enable-usages}"
  }
}

# Install the GCP provider for Crossplane
resource "kubernetes_manifest" "provider_gcp"
{
  manifest =
  {
    apiVersion = "pkg.crossplane.io/v1"
    kind       = "Provider"
    metadata =
    {
      name = "provider-gcp-iam"
    }
    spec =
    {
      package = "xpkg.upbound.io/upbound/provider-gcp-iam:v1.8.0"
    }
  }

  depends_on = [helm_release.crossplane]
}

# ProviderConfig telling Crossplane to use Workload Identity
resource "kubernetes_manifest" "provider_config_gcp"
{
  manifest =
  {
    apiVersion = "gcp.upbound.io/v1beta1"
    kind       = "ProviderConfig"
    metadata =
    {
      name = "default"
    }
    spec =
    {
      projectID = var.project_id
      credentials =
      {
        source = "InjectedIdentity"
      }
    }
  }

  depends_on = [kubernetes_manifest.provider_gcp]
}
