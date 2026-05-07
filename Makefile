.PHONY: bootstrap-repo bootstrap-infrastructure

bootstrap-infrastructure:
	terraform -chdir=infrastructure init
	terraform -chdir=infrastructure apply -var-file=environments/prod.tfvars -var-file=environments/prod.secrets.tfvars
	@auth0_id=$$(terraform -chdir=infrastructure output -raw AUTH_AUTH0_ID); \
	auth0_issuer=$$(terraform -chdir=infrastructure output -raw AUTH_AUTH0_ISSUER); \
	sed -i '' "s|AUTH_AUTH0_ID=.*|AUTH_AUTH0_ID=$$auth0_id|" .env; \
	sed -i '' "s|AUTH_AUTH0_ISSUER=.*|AUTH_AUTH0_ISSUER=$$auth0_issuer|" .env; \
	echo "AUTH_AUTH0_ID and AUTH_AUTH0_ISSUER written to .env"; \
	echo "ACTION REQUIRED: set AUTH_AUTH0_SECRET in .env (Auth0 dashboard → Applications → your app → Settings → Client Secret)"

bootstrap-repo:
	@read -p "App Name (kebab-case): " app_name_kebab; \
	read -p "App Name (display, e.g. My App): " app_name; \
	read -p "App Domain (e.g. myapp.com): " app_domain; \
	read -p "Auth0 Tenant Domain (e.g. your-tenant.auth0.com): " auth0_domain; \
	read -p "Project description (for AI context, a few sentences): " project_description; \
	read -p "Auth0 M2M Client ID (for Terraform): " auth0_mgmt_id; \
	read -s -p "Auth0 M2M Client Secret (for Terraform): " auth0_mgmt_secret; echo; \
	echo "Replacing placeholders..."; \
	grep -rl "<APP_NAME>" . --exclude-dir=".git" --exclude-dir="node_modules" --exclude-dir=".next" | xargs env LC_ALL=C sed -i '' "s|<APP_NAME>|$$app_name_kebab|g"; \
	grep -rl "<APP_NAME_DISPLAY>" . --exclude-dir=".git" --exclude-dir="node_modules" --exclude-dir=".next" | xargs env LC_ALL=C sed -i '' "s|<APP_NAME_DISPLAY>|$$app_name|g"; \
	grep -rl "<APP_DOMAIN>" . --exclude-dir=".git" --exclude-dir="node_modules" --exclude-dir=".next" | xargs env LC_ALL=C sed -i '' "s|<APP_DOMAIN>|$$app_domain|g"; \
	grep -rl "<AUTH0_DOMAIN>" . --exclude-dir=".git" --exclude-dir="node_modules" --exclude-dir=".next" | xargs env LC_ALL=C sed -i '' "s|<AUTH0_DOMAIN>|$$auth0_domain|g"; \
	grep -rl "<PROJECT_DESCRIPTION>" . --exclude-dir=".git" --exclude-dir="node_modules" --exclude-dir=".next" | xargs env LC_ALL=C sed -i '' "s|<PROJECT_DESCRIPTION>|$$project_description|g"; \
	echo "Creating infrastructure/environments/prod.secrets.tfvars..."; \
	printf 'auth0_management_client_id     = "%s"\nauth0_management_client_secret = "%s"\n' "$$auth0_mgmt_id" "$$auth0_mgmt_secret" > infrastructure/environments/prod.secrets.tfvars; \
	if [ ! -f .env ]; then \
		echo "Creating .env..."; \
		auth_secret=$$(openssl rand -base64 32); \
		sed "s|AUTH_SECRET=.*|AUTH_SECRET=$$auth_secret|" .env.example > .env; \
	else \
		echo ".env already exists, skipping."; \
	fi; \
	echo "Done."
