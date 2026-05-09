output "AUTH_AUTH0_ID" {
  description = "Auth0 client ID for Auth.js"
  value       = auth0_client.web.client_id
}

output "AUTH_AUTH0_ISSUER" {
  description = "Auth0 issuer URL for Auth.js"
  value       = "https://${var.auth0_domain}"
}

output "S3_BUCKET_NAME" {
  description = "S3 bucket name for file uploads"
  value       = aws_s3_bucket.files.bucket
}

output "S3_REGION" {
  description = "AWS region for the S3 bucket"
  value       = var.aws_region
}

output "AWS_ACCESS_KEY_ID" {
  description = "IAM access key ID for the app user"
  value       = aws_iam_access_key.app.id
}

output "AWS_SECRET_ACCESS_KEY" {
  description = "IAM secret access key for the app user"
  value       = aws_iam_access_key.app.secret
  sensitive   = true
}
