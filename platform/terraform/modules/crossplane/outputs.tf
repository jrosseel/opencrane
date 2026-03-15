output "crossplane_namespace"
{
  description = "Namespace where Crossplane is installed"
  value       = helm_release.crossplane.namespace
}
