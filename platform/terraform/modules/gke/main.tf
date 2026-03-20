# -----------------------------------------------------------------------------
# GKE module
#
# GKE Autopilot cluster — Google manages nodes, bin-packing, and scaling.
# Nodes scale to zero when no pods are scheduled. You pay per pod resource.
# -----------------------------------------------------------------------------

resource "google_container_cluster" "cluster"
{
  provider = google-beta

  name     = var.cluster_name
  project  = var.project_id
  location = var.region

  network    = var.vpc_id
  subnetwork = var.subnet_id

  # Autopilot mode — no node pools to manage
  enable_autopilot = true

  # Private cluster configuration
  private_cluster_config
  {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  # Master authorized networks -- restrict API access
  master_authorized_networks_config
  {
    cidr_blocks
    {
      cidr_block   = "0.0.0.0/0"
      display_name = "All (restrict in production)"
    }
  }

  # IP allocation policy for VPC-native cluster
  ip_allocation_policy
  {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Release channel for automatic upgrades
  release_channel
  {
    channel = "REGULAR"
  }

  deletion_protection = false
}
