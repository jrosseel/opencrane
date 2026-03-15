# -----------------------------------------------------------------------------
# Cloud SQL module
#
# PostgreSQL 16 instance with private IP, automated backups, and optional HA.
# -----------------------------------------------------------------------------

# Reserve a private IP range for Cloud SQL
resource "google_compute_global_address" "private_ip_range"
{
  name          = "${var.instance_name}-private-ip"
  project       = var.project_id
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = var.vpc_id
}

# Private services connection to allow Cloud SQL to use private IPs
resource "google_service_networking_connection" "private_vpc_connection"
{
  network                 = var.vpc_id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_range.name]
}

resource "google_sql_database_instance" "postgres"
{
  name             = var.instance_name
  project          = var.project_id
  region           = var.region
  database_version = "POSTGRES_16"

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings
  {
    tier              = var.tier
    availability_type = var.high_availability ? "REGIONAL" : "ZONAL"
    disk_autoresize   = true
    disk_size         = 10
    disk_type         = "PD_SSD"

    ip_configuration
    {
      ipv4_enabled    = false
      private_network = var.vpc_id
    }

    backup_configuration
    {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true

      backup_retention_settings
      {
        retained_backups = 7
      }
    }

    maintenance_window
    {
      day          = 7
      hour         = 4
      update_track = "stable"
    }
  }

  deletion_protection = false
}

resource "google_sql_database" "database"
{
  name     = var.db_name
  project  = var.project_id
  instance = google_sql_database_instance.postgres.name
}

# Generate a random password for the database user
resource "random_password" "db_password"
{
  length  = 32
  special = false
}

resource "google_sql_user" "user"
{
  name     = "opencrane"
  project  = var.project_id
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}
