resource "auth0_client" "web" {
  name            = var.app_name_display
  app_type        = "regular_web"
  oidc_conformant = true

  callbacks           = var.auth_callback_urls
  allowed_logout_urls = var.auth_logout_urls

  jwt_configuration {
    alg = "RS256"
  }
}

resource "auth0_connection" "database" {
  name     = "${local.name_prefix}-db"
  strategy = "auth0"

  options {
    password_policy        = "good"
    brute_force_protection = true
    requires_username      = false
  }
}

resource "auth0_connection_clients" "database" {
  connection_id   = auth0_connection.database.id
  enabled_clients = [auth0_client.web.client_id]
}

resource "auth0_branding" "main" {
  colors {
    primary         = "#2563eb"
    page_background = "#f9fafb"
  }
}
