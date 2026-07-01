# Despliegue y operaciones — Cirochat

> Documento de referencia para cualquier persona o IA que opere esta aplicación.
> Mantener actualizado cuando cambie la infraestructura.

## 1. Arquitectura

- **App**: Next.js 16 + Prisma 7 + NextAuth + PostgreSQL con extensión `pgvector` (embeddings vectoriales para RAG).
- **Hosting**: VPS de Contabo (`84.46.249.81`). El VPS está gestionado por **Coolify** y el proxy público es **Traefik** (contenedor `coolify-proxy`) en los puertos 80/443, con SSL Let's Encrypt automático.
- **Cirochat en producción** corre en **contenedores Docker propios** gestionados por SSH + `docker compose` (NO aparecen ni se gestionan desde el panel de Coolify). Traefik los descubre por etiquetas y les sirve HTTPS.

## 2. Entornos (¡importante!)

| | Desarrollo | Producción |
|---|---|---|
| App | tu Mac, `npm run dev` | contenedor `cirochat-app` en el VPS |
| DB | pgvector del VPS, **puerto 5433** (contenedor `bv09lxzuezuamodkguqcixed`, db `postgres`) | contenedor `cirochat-db` (pgvector pg16) |
| Datos | pruebas | datos reales de clientes |
| URL | `http://localhost:3000` | `https://cirochat.agenciaciro.com` |

El `.env` **local** apunta la `DATABASE_URL` a la DB de desarrollo (5433). Dev y prod están aislados: **nada de lo que hagas en dev afecta a producción hasta que despliegas a propósito.**

## 3. Acceso al VPS

- Alias SSH (en el Mac de Omar): `ssh cirochat-vps` (config en `~/.ssh/config`, clave `~/.ssh/cirochat_contabo`, usuario `root`).
- Alternativa directa: `ssh root@84.46.249.81`.
- El VPS lee el repo privado de GitHub con una **deploy key de solo lectura** (registrada en `OmarPumariega/cirochat`).

## 4. Producción en el VPS

- **Carpeta**: `/opt/cirochat` = checkout limpio de `origin/main` (rama `main`).
- Archivos clave:
  - `docker-compose.yml` — define servicios `app` + `db`, redes, volúmenes y **etiquetas Traefik**.
  - `.env` — **secretos de producción** (NO está en git, permisos `600`). **Nunca commitear.**
  - `deploy.sh` — helper de despliegue (no está en git).
- El resto del código es exactamente el del repo.

### Cómo está montado (`docker-compose.yml`)

- **`db`** (`cirochat-db`): imagen `pgvector/pgvector:pg16`. Volumen `cirochat_cirochat_pgdata`. Solo en la red interna `cirochat_cirochat-internal` (el puerto 5432 **no** se publica al host).
- **`app`** (`cirochat-app`): imagen construida desde el `Dockerfile`. Puerto interno 3000 (no publicado al host). Conectada a `cirochat_cirochat-internal` (para reaching la DB) y a la red **`coolify`** externa (para que la alcance Traefik).
- **Traefik** enruta `cirochat.agenciaciro.com` → `cirochat-app:3000` mediante las etiquetas (`traefik.*`) del `docker-compose.yml`. HTTP→HTTPS y certificado vía `certresolver=letsencrypt`.
- **Volúmenes**: `cirochat_cirochat_pgdata` (DB) y `cirochat_cirochat_uploads` (uploads en `/app/public/uploads`).

## 5. Variables de entorno (`.env` de producción)

Definidas en `/opt/cirochat/.env` (plantilla: `.env.production.example` en el repo):

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — credenciales de la DB.
- `NEXTAUTH_URL=https://cirochat.agenciaciro.com`
- `NEXTAUTH_SECRET` — firma de sesiones (`openssl rand -base64 32`).
- `ENCRYPTION_KEY` — encripta las API keys de los tenants. **Exactamente 32 caracteres** (`openssl rand -hex 16`).
- `EMAIL_*` — SMTP para notificaciones de leads (opcional).
- `DATABASE_URL` la construye el `docker-compose.yml` (apunta al servicio `db`); **no se pone a mano**.

## 6. Flujo: desarrollo → producción

1. Programa y prueba en local (`npm run dev`, contra la DB dev 5433).
2. Si hay cambios de **base de datos**: `npm run db:migrate` → se aplica **solo a dev**. Revisa el SQL generado en `prisma/migrations/` y commitea esos archivos.
3. `git commit` + `git push origin main`.
4. Despliega:
   ```bash
   ssh cirochat-vps '/opt/cirochat/deploy.sh'
   ```
   Esto hace `git pull` → reconstruir imagen → reiniciar. Las migraciones nuevas se aplican **solas** al arrancar el contenedor (`prisma migrate deploy` está en el `CMD` del `Dockerfile`).

## 7. Reglas críticas (NO hacer)

- ❌ No apuntes el `.env` **local** a la DB de **producción**.
- ❌ No ejecutes `prisma migrate` / `db:migrate` contra producción (lo hace el contenedor al arrancar).
- ❌ No edites archivos a mano en `/opt/cirochat` en el VPS: cambia el código en el repo y despliega por git.
- ❌ No publiques puertos de la app al host (rompería el aislamiento; Traefik la alcanza por la red `coolify`).
- ❌ No toques los otros contenedores del VPS (Coolify, WordPress, n8n, etc.) — son **otros proyectos**.
- ❌ No quites las variables dummy del `Dockerfile` durante el `RUN npm run build` (ver §8) o el build fallará.

## 8. El build de Docker (gotcha)

`next build` se ejecuta **sin `.env`** dentro del contenedor. Algunos módulos leen variables de entorno al cargarse a nivel de módulo:

- `src/lib/crypto.ts` → `Buffer.from(process.env.ENCRYPTION_KEY, "utf8")`
- `src/lib/db/prisma.ts` → `new PrismaPg({ connectionString: process.env.DATABASE_URL })`

Sin env, esas líneas lanzan `ERR_INVALID_ARG_TYPE` durante el "collect page data" de Next. Por eso el `Dockerfile` pasa **envs dummy solo durante el build** (`ENCRYPTION_KEY`, `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`). Los valores reales llegan en runtime desde el compose.

> Si en el futuro haces lazy-init en esos módulos, podrás quitar los envs dummy.

## 9. Rollback

```bash
ssh cirochat-vps 'cd /opt/cirochat && git checkout <commit-anterior> && docker compose up -d --build'
```

## 10. Comandos útiles (desde el Mac)

```bash
# Desplegar
ssh cirochat-vps '/opt/cirochat/deploy.sh'

# Logs en vivo de la app
ssh cirochat-vps 'cd /opt/cirochat && docker compose logs -f app'

# Estado de los contenedores
ssh cirochat-vps 'cd /opt/cirochat && docker compose ps'

# Reiniciar solo la app
ssh cirochat-vps 'cd /opt/cirochat && docker compose restart app'

# Consola SQL de la DB de producción
ssh cirochat-vps 'docker exec -it cirochat-db psql -U cirochat -d cirochat'

# Re-ejecutar el seed (crea tenant demo + admin)
ssh cirochat-vps 'cd /opt/cirochat && docker compose exec -T app npx prisma db seed'
```

## 11. Seed / usuarios iniciales

`prisma/seed.ts` crea el tenant `demo` y un superadmin `admin@cirochat.com`. La contraseña del seed (`admin1234`) es temporal: **en producción ya está cambiada**. Cambiar siempre tras un seed fresco.

## 12. Backup (PENDIENTE)

⚠️ Aún **NO** hay backup automático de la DB de producción. Tarea pendiente: cron + `pg_dump` del contenedor `cirochat-db` hacia `/opt/backups` (o almacenamiento externo) + script de restauración.

## 13. Notas sobre el VPS compartido

El VPS `84.46.249.81` aloja otros proyectos gestionados por Coolify (varios WordPress, MariaDB, n8n, y **otro** pgvector en el puerto 5433 que es la DB de **desarrollo** de este propio Cirochat). Cirochat de producción está aislado en su propia red (`cirochat_cirochat-internal`) y compose; **no interferir** con los demás contenedores.
