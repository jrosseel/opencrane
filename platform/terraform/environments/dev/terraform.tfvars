# -----------------------------------------------------------------------------
# Dev environment values
# (auto-overwritten by deploy.sh — edit there or here before manual apply)
# -----------------------------------------------------------------------------

project_id  = "opencrane-dev"
region      = "europe-west1"
environment = "dev"
domain      = "opencrane.example.com"
image_tag   = "latest"

# Networking
vpc_name = "opencrane-dev-vpc"

# GKE
cluster_name = "opencrane-dev-cluster"

# Cloud SQL
db_instance_name     = "opencrane-dev-db"
db_name              = "opencrane"
db_tier              = "db-f1-micro"
db_high_availability = false
