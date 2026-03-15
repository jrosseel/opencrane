# -----------------------------------------------------------------------------
# GKE module
#
# Private GKE cluster with Workload Identity, GCS Fuse CSI, and an
# autoscaling node pool.
# -----------------------------------------------------------------------------

resource "google_container_cluster" "cluster"
{
  provider = google-beta

  name     = var.cluster_name
  project  = var.project_id
  location = var.region

  network    = var.vpc_id
  subnetwork = var.subnet_id

  # Use a separately managed node pool
  remove_default_node_pool = true
  initial_node_count       = 1

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

  # Workload Identity
  workload_identity_config
  {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # GCS Fuse CSI driver
  addons_config
  {
    gcs_fuse_csi_driver_config
    {
      enabled = true
    }
  }

  # Release channel for automatic upgrades
  release_channel
  {
    channel = "REGULAR"
  }

  deletion_protection = false
}

resource "google_container_node_pool" "primary"
{
  name     = "${var.cluster_name}-primary"
  project  = var.project_id
  location = var.region
  cluster  = google_container_cluster.cluster.name

  # Autoscaling: 1 to 5 nodes
  autoscaling
  {
    min_node_count = 1
    max_node_count = 5
  }

  node_config
  {
    machine_type = var.node_machine_type
    disk_size_gb = 100
    disk_type    = "pd-standard"

    oauth_scopes =
    [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    # Workload Identity on nodes
    workload_metadata_config
    {
      mode = "GKE_METADATA"
    }

    labels =
    {
      environment = "opencrane"
    }

    tags = ["opencrane-gke-node"]
  }

  management
  {
    auto_repair  = true
    auto_upgrade = true
  }
}
