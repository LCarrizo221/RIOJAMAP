# Tasks: Producción Deploy — VPS DevLab1

## Task List

### 1. Preparación de código para producción
- [x] Agregar dominio producción a CORS en `server/src/index.ts`
- [x] Crear `ecosystem.config.cjs` para PM2
- [x] Crear `.gitignore` (node_modules, dist, .env)
- [x] Verificar que frontend usa `API_BASE = '/api'` (no necesita cambio)

### 2. GitHub repo
- [x] Crear repo público LCarrizo221/RIOJAMAP vía API
- [x] git init + commit inicial + push a main

### 3. VPS: Conexión inicial y exploración
- [x] SSH a VPS (179.43.127.166:5008)
- [x] Verificar proyectos existentes en `/var/www/`
- [x] Verificar PostgreSQL, Nginx, PM2, Certbot disponibles
- [x] Identificar puertos ocupados: 3000, 3001, 3002, 5000

### 4. VPS: Base de datos
- [x] Crear usuario PostgreSQL: `riojamap`
- [x] Crear database: `riojamap` (owner: riojamap)
- [x] Crear `server/.env` con DATABASE_URL producción

### 5. VPS: Backend setup
- [x] Clonar repo en `/var/www/RIOJAMAP`
- [x] Instalar dependencias (`npm install`)
- [x] Generar Prisma client (`npx prisma generate`)
- [x] Correr migrations (`npx prisma migrate deploy`)
- [x] Compilar TypeScript (`npm run build`)
- [x] Seedear DB con 44 obras (`npx tsx seed.ts`)

### 6. Frontend build + VPS sync
- [x] Build local (Vite)
- [x] Rsync `client/dist/` a VPS

### 7. VPS: PM2
- [x] Crear `/var/log/pm2/` si no existe
- [x] Iniciar backend con `pm2 start ecosystem.config.cjs --env production`
- [x] Resolver conflicto: ecosystem.config.js debe ser .cjs (ESM)
- [x] Resolver conflicto: puerto 3001 ocupado → cambiar a 3003
- [x] `pm2 save` para persistir

### 8. VPS: Nginx
- [x] Crear config en `/etc/nginx/sites-available/riojamap.devlab1.online`
- [x] Habilitar sitio (symlink en sites-enabled)
- [x] Agregar location /health para health check del backend
- [x] Verificar sintaxis (`nginx -t`)
- [x] Recargar Nginx

### 9. VPS: SSL
- [x] Certbot: `certbot --nginx -d riojamap.devlab1.online`
- [x] Verificar certificado
- [x] Verificar redirect HTTP→HTTPS

### 10. Verificación final
- [x] Health endpoint: `curl https://riojamap.devlab1.online/health` → `{"status":"ok"}`
- [x] API obras: 44 registros retornados
- [x] API KPIs: totals correctos ($1.755.000.000)
- [x] Frontend: HTTP 200
- [x] PM2: online, 0 restarts
- [x] SSL: expires Oct 6 2026

## Minor Fixes Documentados

| Fix | Archivo | Razón |
|-----|---------|-------|
| CORS production domain | `server/src/index.ts` | Permitir requests desde HTTPS |
| Puerto 3001 → 3003 | `server/src/index.ts` + `ecosystem.config.cjs` | 3001 ocupado por nutrilandingBackend |
| ecosystem.js → .cjs | `ecosystem.config.cjs` | ESM conflict con `"type": "module"` en package.json |
| /health proxy | Nginx config | Health check no estaba en location /api/ |
| .gitignore | `.gitignore` | Excluir node_modules, dist, .env |
| repo público | GitHub | Necesario para git pull en VPS |
