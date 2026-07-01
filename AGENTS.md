<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:deployment -->
# Despliegue y producción (leer antes de operar)

Documentación completa en **`DEPLOYMENT.md`** (leerla antes de un deploy o cambio de infra). Resumen crítico:

- **Producción** = contenedores Docker propios (`cirochat-app` + `cirochat-db` pgvector) en el VPS Contabo `84.46.249.81`, carpeta `/opt/cirochat` (checkout de `origin/main`). El proxy público es **Traefik** (gestionado por Coolify), SSL automático. URL: `https://cirochat.agenciaciro.com`.
- **Acceso**: `ssh cirochat-vps` (alias del Mac de Omar). El VPS lee el repo con una deploy key de GitHub (solo lectura).
- **Desarrollo** se hace en local con `npm run dev` contra la DB dev (pgvector del VPS, puerto 5433). Dev y prod están aislados.
- **Desplegar**: `git push origin main` y luego `ssh cirochat-vps '/opt/cirochat/deploy.sh'` (git pull + rebuild + restart). Las migraciones se aplican solas al arrancar el contenedor.
- **Reglas críticas (NO hacer)**:
  - No apuntes el `.env` local a la DB de producción.
  - No ejecutes `prisma migrate`/`db:migrate` contra producción (lo hace el contenedor).
  - No edites a mano archivos en `/opt/cirochat`: cambia el repo y despliega por git.
  - No publiques puertos de la app al host (rompe el aislamiento; Traefik la alcanza por la red `coolify`).
  - No quites las variables dummy del `Dockerfile` durante `RUN npm run build` (el build fallaría; ver DEPLOYMENT.md §8).
  - No toques otros contenedores del VPS (Coolify, WordPress, n8n) — son otros proyectos.
- **`.env` de producción** vive solo en `/opt/cirochat/.env` (no está en git). Plantilla: `.env.production.example`.
<!-- END:deployment -->

