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

variable "vpc_id"
{
  description = "Self-link of the VPC network"
  type        = string
}

variable "instance_name"
{
  description = "Cloud SQL instance name"
  type        = string
}

variable "db_name"
{
  description = "Name of the PostgreSQL database"
  type        = string
}

variable "tier"
{
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "high_availability"
{
  description = "Enable regional high availability"
  type        = bool
  default     = false
}
