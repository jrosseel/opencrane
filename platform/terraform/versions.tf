terraform {
  required_version = ">= 1.5.0"

  required_providers
  {
    google =
    {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }

    google-beta =
    {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }

    helm =
    {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }

    kubernetes =
    {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }

    random =
    {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "google"
{
  project = var.project_id
  region  = var.region
}

provider "google-beta"
{
  project = var.project_id
  region  = var.region
}
