app_name         = "<APP_NAME>"
app_name_display = "<APP_NAME_DISPLAY>"
environment      = "prod"

auth0_domain = "<AUTH0_DOMAIN>"

auth_callback_urls = [
  "http://localhost:3000/api/auth/callback/auth0",
  "https://<APP_DOMAIN>/api/auth/callback/auth0",
]
auth_logout_urls = [
  "http://localhost:3000",
  "https://<APP_DOMAIN>",
]
