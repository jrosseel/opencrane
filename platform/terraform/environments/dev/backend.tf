# -----------------------------------------------------------------------------
# GCS backend for Terraform state
#
# Uncomment and configure before running terraform init.
# The GCS bucket must be created beforehand:
#   gsutil mb -p opencrane-dev -l europe-west1 gs://opencrane-dev-tfstate
#   gsutil versioning set on gs://opencrane-dev-tfstate
# -----------------------------------------------------------------------------

# terraform {
#   backend "gcs"
#   {
#     bucket = "opencrane-dev-tfstate"
#     prefix = "terraform/state"
#   }
# }
