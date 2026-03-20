output "ingress_ip"
{
  description = "External IP address of the ingress controller"
  value       = google_compute_global_address.ingress_ip.address
}

output "database_host"
{
  description = "In-cluster PostgreSQL service hostname"
  value       = "opencrane-db-postgresql.${var.namespace}.svc.cluster.local"
}

output "control_plane_url"
{
  description = "URL for the OpenCrane control-plane UI"
  value       = "https://${var.domain}"
}
