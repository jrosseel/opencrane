# -----------------------------------------------------------------------------
# OpenCrane GCP Infrastructure
#
# Provisions networking, GKE, Cloud SQL, and Crossplane for the
# OpenCrane platform control plane.
# -----------------------------------------------------------------------------

module "networking"
{
  source = "./modules/networking"

  project_id = var.project_id
  region     = var.region
  vpc_name   = var.vpc_name
}

module "gke"
{
  source = "./modules/gke"

  project_id        = var.project_id
  region            = var.region
  cluster_name      = var.cluster_name
  vpc_id            = module.networking.vpc_id
  subnet_id         = module.networking.subnet_id
  node_machine_type = var.node_machine_type

  depends_on = [module.networking]
}

# Configure kubernetes and helm providers using GKE cluster credentials
provider "kubernetes"
{
  host                   = "https://${module.gke.cluster_endpoint}"
  cluster_ca_certificate = base64decode(module.gke.cluster_ca_certificate)
  token                  = data.google_client_config.default.access_token
}

provider "helm"
{
  kubernetes
  {
    host                   = "https://${module.gke.cluster_endpoint}"
    cluster_ca_certificate = base64decode(module.gke.cluster_ca_certificate)
    token                  = data.google_client_config.default.access_token
  }
}

data "google_client_config" "default" {}

module "cloudsql"
{
  source = "./modules/cloudsql"

  project_id        = var.project_id
  region            = var.region
  vpc_id            = module.networking.vpc_id
  instance_name     = var.db_instance_name
  db_name           = var.db_name
  tier              = var.db_tier
  high_availability = var.db_high_availability

  depends_on = [module.networking]
}

module "crossplane"
{
  source = "./modules/crossplane"

  project_id = var.project_id

  depends_on = [module.gke]
}
