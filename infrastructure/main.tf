terraform {
  required_providers {
    auth0 = {
      source  = "auth0/auth0"
      version = "~> 1.4"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "auth0" {
  domain        = var.auth0_domain
  client_id     = var.auth0_management_client_id
  client_secret = var.auth0_management_client_secret
}

locals {
  name_prefix = "${var.app_name}-${var.environment}"
}
