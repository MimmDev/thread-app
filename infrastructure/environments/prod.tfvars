app_name         = "thread-app"
app_name_display = "Thread App"
environment      = "prod"

auth0_domain = "mimmdev.au.auth0.com"

auth_callback_urls = [
  "http://localhost:3000/api/auth/callback/auth0",
  "https://thread.mimm.dev/api/auth/callback/auth0",
]
auth_logout_urls = [
  "http://localhost:3000",
  "https://thread.mimm.dev",
]
