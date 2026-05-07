variable "app_name" {
  description = "Application name in kebab-case — used as a prefix for all resources"
  type        = string
}

variable "app_name_display" {
  description = "Human-readable application name — used in user-facing strings"
  type        = string
}

variable "environment" {
  description = "Deployment environment (prod, staging)"
  type        = string
}

variable "auth0_domain" {
  description = "Auth0 tenant domain (e.g. your-tenant.auth0.com)"
  type        = string
}

variable "auth0_management_client_id" {
  description = "Auth0 Machine-to-Machine client ID for Terraform"
  type        = string
}

variable "auth0_management_client_secret" {
  description = "Auth0 Machine-to-Machine client secret for Terraform"
  type        = string
  sensitive   = true
}

variable "auth_callback_urls" {
  description = "Allowed OAuth callback URLs"
  type        = list(string)
}

variable "auth_logout_urls" {
  description = "Allowed logout URLs"
  type        = list(string)
}
