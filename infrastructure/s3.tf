resource "aws_s3_bucket" "files" {
  bucket = "${local.name_prefix}-files"
}

resource "aws_s3_bucket_public_access_block" "files" {
  bucket = aws_s3_bucket.files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "files" {
  bucket = aws_s3_bucket.files.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT"]
    allowed_origins = var.s3_cors_origins
    max_age_seconds = 3000
  }
}

resource "aws_iam_user" "app" {
  name = "${local.name_prefix}-app"
}

resource "aws_iam_access_key" "app" {
  user = aws_iam_user.app.name
}

resource "aws_iam_policy" "s3_app" {
  name = "${local.name_prefix}-s3-app"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.files.arn}/*"
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "app_s3" {
  user       = aws_iam_user.app.name
  policy_arn = aws_iam_policy.s3_app.arn
}
