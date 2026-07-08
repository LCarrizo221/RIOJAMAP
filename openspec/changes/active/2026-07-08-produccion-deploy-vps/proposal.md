# Proposal: Producción Deploy — VPS DevLab1

## Intent

Poner RIOJAMAP en producción en el VPS de DonWeb (devlab1.online). Configurar infraestructura completa: PostgreSQL, PM2, Nginx, SSL, y dominio riojamap.devlab1.online. Seedear la base de datos con 44 obras de prueba.

## Scope

### In Scope
- Crear repositorio GitHub (LCarrizo221/RIOJAMAP) y pushear código
- Configurar PostgreSQL: usuario, database, migrations, seed (44 obras)
- Configurar PM2 con ecosystem.config.cjs para manejar el backend
- Configurar Nginx como reverse proxy para frontend SPA + API
- SSL con Certbot (Let's Encrypt) para HTTPS
- Adaptar CORS para producción
- Build frontend (Vite) local + rsync a VPS
- Resolver conflictos de puertos con proyectos existentes

### Out of Scope
- Autenticación/autorización
- CI/CD pipeline
- Tests automatizados
- Backup automático de DB
- Monitorización / alertas
- Migración de datos históricos desde Google Sheets

## Capabilities

### New Capabilities
- `produccion-deploy`: Infraestructura completa de producción en VPS
- `ssl-termination`: HTTPS vía Let's Encrypt con renovación automática
- `pm2-process-management`: Backend manejado por PM2 con auto-reinicio
- `nginx-reverse-proxy`: Frontend SPA + proxy API en un solo dominio

### Modified Capabilities
- `obra-crud-api`: Puerto cambiado de 3001 a 3003 por conflicto con nutrilandingBackend
- `frontend-api-integration`: CORS actualizado para incluir dominio producción

## Approach

1. Crear GitHub repo + push inicial
2. SSH a VPS, clonar repo
3. Crear usuario PostgreSQL + database + grant privileges
4. Instalar dependencias, Prisma generate, migrations, seed
5. Build backend (TypeScript → JS)
6. Build frontend local + rsync dist/ a VPS
7. Configurar PM2 (ecosystem.config.cjs con env production)
8. Configurar Nginx (reverse proxy /api/ → backend, SPA para el resto)
9. SSL con Certbot (certificate + auto-renewal)
10. Verificar: health, API, frontend, redirect HTTP→HTTPS

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `server/src/index.ts` | Modified | CORS: agregado dominio producción |
| `ecosystem.config.cjs` | New | Configuración PM2 para producción |
| `.gitignore` | New | Excluir node_modules, dist, .env |
| `server/.env` | New (VPS) | DATABASE_URL con credenciales producción |
| `client/dist/` | New | Build de producción (no en git) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Puerto ocupado por otro proyecto | Medium | Verificar con `ss -tlnp`, elegir puerto libre |
| ESM vs CJS conflict con PM2 | Medium | Usar extensión `.cjs` si package.json tiene `"type": "module"` |
| Certbot rate limit | Low | Usar --dry-run primero si hay dudas |
| DB password en .env en VPS | Low | .env en .gitignore, crear manualmente en VPS |
| Node.js version incompatible | Low | VPS tiene Node 24.14.0, compatible con el stack |

## Rollback Plan

1. `pm2 delete riojamap-backend` para detener backend
2. `rm /etc/nginx/sites-enabled/riojamap.devlab1.online` + `systemctl reload nginx`
3. `dropdb riojamap && dropuser riojamap` para limpiar DB
4. `rm -rf /var/www/RIOJAMAP` para eliminar código

## Dependencies

- VPS DonWeb accesible vía SSH (puerto 5008)
- PostgreSQL 14 instalado en VPS (verificado)
- Nginx instalado en VPS (verificado)
- Certbot instalado en VPS (verificado)
- PM2 instalado en VPS (verificado)
- Dominio riojamap.devlab1.online apuntando a 179.43.127.166
- GitHub Personal Access Token para crear repo y pushear

## Success Criteria

- [x] GitHub repo creado y código pusheado
- [x] PostgreSQL: usuario, database, migrations, seed (44 obras)
- [x] Backend corre con PM2 en puerto 3003
- [x] Frontend sirve en https://riojamap.devlab1.online
- [x] API responde en /api/obras, /api/obras/kpis, /health
- [x] SSL activo (https), HTTP redirige a HTTPS
- [x] CORS permite peticiones desde el dominio producción
- [x] PM2 persiste después de reboot (pm2 save)
