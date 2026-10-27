# KandyAds — isolated deployment on an existing AWS Lightsail host

This adds **new** Docker services and Nginx virtual hosts. It does not modify other projects, reboot the instance, or claim ports 80/443 inside Docker.

## Layout / assumptions
- Ubuntu 24.04, working Docker Compose plugin, working host Nginx, and sufficient free RAM/disk.
- Three host-loopback bindings: public website 9030, admin 9031, API 9032.
- One private MySQL 8 container with persistent Docker volume `kandyads_mysql_data`. No database port is published.
- Domain examples in `deploy/nginx-kandyads.http.conf` use **kandyads.lk**; replace if actual domain spelling differs.
- DNS changes and HTTPS are deliberately separate from initial server deployment.

## 0. Safe preflight
```bash
whoami
uname -a
free -h
df -h /
sudo docker version
sudo docker compose version
sudo nginx -t
sudo ss -ltnp | grep -E ':(80|443|9030|9031|9032)\\b' || true
sudo docker ps --format 'table {{.Names}}\\t{{.Ports}}\\t{{.Status}}'
```
If 9030, 9031 or 9032 is occupied, edit only the KandyAds host bindings in `compose.production.yml` and their corresponding reverse proxy targets before proceeding. On an existing 4-GB Lightsail with many containers, check available memory and consider adding 2 GiB of swap before large Node/Vite builds; swap is emergency memory, not a substitute for RAM. Do not proceed if existing services are under memory pressure.

## 1. Get the deployment branch
```bash
sudo mkdir -p /opt/apps/kandyads
sudo chown "$USER":"$USER" /opt/apps/kandyads
git clone --branch feature/lightsail-docker-deployment https://github.com/infosloption-byte/kandyads.git /opt/apps/kandyads
cd /opt/apps/kandyads
cp .env.production.example .env.production
chmod 600 .env.production
```
Edit `.env.production` and replace all CHANGE_TO... values using **different** random values from `openssl rand -hex 24`. Passwords must be URL-safe hex because Compose constructs the MySQL `DATABASE_URL`. Do not paste secrets into chat or commit the file.

If the repo already exists in the target location, fetch and check out the branch instead of cloning or deleting the directory. The Nginx proxy replaces client-supplied X-Forwarded-For and Fastify trusts its proxy header in production for per-client rate limiting.

## 2. Build Docker images, start only the database
```bash
sudo docker compose --env-file .env.production -f compose.production.yml config --quiet
# Build one at a time to reduce peak memory usage on shared 4-GB server.
sudo docker compose --env-file .env.production -f compose.production.yml build api
sudo docker compose --env-file .env.production -f compose.production.yml build frontend
sudo docker compose --env-file .env.production -f compose.production.yml build admin
sudo docker compose --env-file .env.production -f compose.production.yml up -d mysql
sudo docker compose --env-file .env.production -f compose.production.yml ps
```
Do not start the API yet: its startup loads workflow configuration from SQL tables that must be initialized first. After each build, check `free -h`, `df -h /`, and `sudo docker ps` for impact to the existing workloads. If any other container becomes unhealthy or the host starts swapping heavily, stop KandyAds deployment and investigate.

## 3. FIRST-TIME EMPTY DATABASE ONLY
The repository's historical Prisma migrations do not contain a complete initial baseline. Its CI creates base models with `prisma db push` and then executes a set of supplementary SQL migrations. Thus **do not run `prisma migrate deploy` against an empty DB** and **never use `--accept-data-loss` on production**.

The following procedure is for a **brand-new empty KandyAds DB only**. Do not rerun it on an existing populated database. A production migration baseline should be formalized before later schema changes.

```bash
dc() { sudo docker compose --env-file .env.production -f compose.production.yml "$@"; }
dc run --rm api npx prisma db push --skip-generate

for migration in \
  20260902143000_employee_skills_roles \
  20260902160000_company_settings \
  20260902163000_branches_number_sequences \
  20260902170000_settings_catalogues \
  20260902180000_workflow_configuration \
  20260902183000_vendor_deliverables_invoices \
  20260902200000_supplier_invoice_purchasing_link \
  20260903200000_notifications
do
  dc run --rm api npx prisma db execute --schema prisma/schema.prisma --file "prisma/migrations/$migration/migration.sql" || break
done
```
If any step errors, stop and investigate before attempting anything again. These SQL scripts are **not** generally rerunnable.

### Create a production administrator without demo accounts
```bash
read -r -p 'Admin email: ' KANDYADS_ADMIN_EMAIL
read -r -s -p 'Strong admin password (16+ chars): ' KANDYADS_ADMIN_PASSWORD; echo
export KANDYADS_ADMIN_EMAIL KANDYADS_ADMIN_PASSWORD
dc run --rm -e KANDYADS_ADMIN_EMAIL -e KANDYADS_ADMIN_PASSWORD api node scripts/bootstrap-production.mjs
unset KANDYADS_ADMIN_EMAIL KANDYADS_ADMIN_PASSWORD
```
This creates permission roles, six public quote services and a single admin user. **Do not run `npm run prisma:seed`** on production; it creates demo users with a known password and fictional business/financial records.

## 4. Start web, admin, API
```bash
dc up -d api frontend admin
dc ps
dc logs --tail=80 api
curl -fsSI http://127.0.0.1:9030/
curl -fsSI http://127.0.0.1:9031/
curl -fsS http://127.0.0.1:9032/health
curl -fsS http://127.0.0.1:9032/api/v1/public/quote-estimator
```
`/health` should return a JSON `status:ok`. The public API endpoint returning service pricing verifies that the route was registered.

## 5. Add ONLY the new Nginx hosts
```bash
sudo cp deploy/nginx-kandyads.http.conf /etc/nginx/sites-available/kandyads.conf
sudo ln -s /etc/nginx/sites-available/kandyads.conf /etc/nginx/sites-enabled/kandyads.conf
sudo nginx -t && sudo systemctl reload nginx
curl -I -H 'Host: kandyads.lk' http://127.0.0.1/
curl -I -H 'Host: admin.kandyads.lk' http://127.0.0.1/
curl -H 'Host: api.kandyads.lk' http://127.0.0.1/health
```
If the symlink already exists, do not recreate it. The host names here are **examples until the exact domain is confirmed**. Existing Nginx sites remain untouched.

## 6. Do not switch DNS until the launch checks pass
- Confirm production build in browser on a hosts-file mapping or staging hostname.
- Confirm admin authentication, API CORS, contact POST, estimator load and database writes.
- Fix the separate active `/quote` page: currently its form shows a success state without sending an API request. It must not promise submissions in production.
- Verify HTTPS, backups, rate limiting, error handling, and disable any demo credentials.
- Then point only the KandyAds records in LankaHost DNS to the Lightsail static IPv4.
- Once DNS resolves, configure certificates for `kandyads.lk`, `www.kandyads.lk`, `admin.kandyads.lk`, `api.kandyads.lk` with Certbot and enforce HTTPS.

## Maintenance
The Compose project is named `kandyads`. Avoid `docker compose down -v` (that deletes the KandyAds DB volume). Back up MySQL and test restores regularly. Never bind MySQL to a public host port. Do not use `docker system prune --volumes` on the shared Lightsail instance.

Production limitations: the backend and admin currently lack tracked npm lockfiles; reproducible dependency pinning should be added. The database baseline and active quotation form need further work before publicly launching the entire system.
