variable "project_id"
{
  description = "GCP project ID"
  type        = string
}

variable "region"
{
  description = "GCP region"
  type        = string
}

variable "cluster_name"
{
  description = "Name for the GKE cluster"
  type        = string
}

variable "vpc_id"
{
  description = "Self-link of the VPC network"
  type        = string
}

variable "subnet_id"
{
  description = "Self-link of the subnet"
  type        = string
}
