# -----------------------------------------------------------------------------
# Root outputs
# -----------------------------------------------------------------------------

output "cluster_name"
{
  description = "GKE cluster name"
  value       = module.gke.cluster_name
}

output "cluster_endpoint"
{
  description = "GKE cluster endpoint"
  value       = module.gke.cluster_endpoint
  sensitive   = true
}

output "database_connection_name"
{
  description = "Cloud SQL connection name (project:region:instance)"
  value       = module.cloudsql.connection_name
}

output "database_private_ip"
{
  description = "Cloud SQL private IP address"
  value       = module.cloudsql.private_ip
  sensitive   = true
}

output "database_url"
{
  description = "PostgreSQL connection string"
  value       = module.cloudsql.database_url
  sensitive   = true
}

output "kubeconfig_command"
{
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${module.gke.cluster_name} --region ${var.region} --project ${var.project_id}"
}
