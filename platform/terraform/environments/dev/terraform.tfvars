# -----------------------------------------------------------------------------
# Dev environment values
# -----------------------------------------------------------------------------

project_id  = "opencrane-dev"
region      = "europe-west1"
environment = "dev"

# Networking
vpc_name = "opencrane-dev-vpc"

# GKE
cluster_name      = "opencrane-dev-cluster"
node_machine_type = "e2-standard-4"

# Cloud SQL
db_instance_name     = "opencrane-dev-db"
db_name              = "opencrane"
db_tier              = "db-f1-micro"
db_high_availability = false
