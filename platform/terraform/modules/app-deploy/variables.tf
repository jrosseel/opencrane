variable "project_id"
{
  description = "GCP project ID"
  type        = string
}

variable "namespace"
{
  description = "Kubernetes namespace for the OpenCrane deployment"
  type        = string
  default     = "opencrane"
}

variable "release_name"
{
  description = "Helm release name"
  type        = string
  default     = "opencrane"
}

variable "registry_url"
{
  description = "Artifact Registry URL (region-docker.pkg.dev/project/repo)"
  type        = string
}

variable "image_tag"
{
  description = "Docker image tag for OpenCrane components"
  type        = string
  default     = "latest"
}

variable "domain"
{
  description = "Base domain for tenant subdomains"
  type        = string
}
