output "AUTH_AUTH0_ID" {
  description = "Auth0 client ID for Auth.js"
  value       = auth0_client.web.client_id
}

output "AUTH_AUTH0_ISSUER" {
  description = "Auth0 issuer URL for Auth.js"
  value       = "https://${var.auth0_domain}"
}
