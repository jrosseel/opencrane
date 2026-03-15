# -----------------------------------------------------------------------------
# Root variables for OpenCrane GCP infrastructure
# -----------------------------------------------------------------------------

variable "project_id"
{
  description = "GCP project ID"
  type        = string
}

variable "region"
{
  description = "GCP region for all resources"
  type        = string
  default     = "europe-west1"
}

variable "environment"
{
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# Networking
variable "vpc_name"
{
  description = "Name for the VPC network"
  type        = string
  default     = "opencrane-vpc"
}

# GKE
variable "cluster_name"
{
  description = "Name for the GKE cluster"
  type        = string
  default     = "opencrane-cluster"
}

variable "node_machine_type"
{
  description = "Machine type for GKE node pool"
  type        = string
  default     = "e2-standard-4"
}

# Cloud SQL
variable "db_instance_name"
{
  description = "Cloud SQL instance name"
  type        = string
  default     = "opencrane-db"
}

variable "db_name"
{
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "opencrane"
}

variable "db_tier"
{
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_high_availability"
{
  description = "Enable high availability for Cloud SQL"
  type        = bool
  default     = false
}
