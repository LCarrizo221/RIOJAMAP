# Design: Producción Deploy — VPS DevLab1

## Technical Approach

Despliegue en **VPS single-tenant** con stack tradicional: Nginx como reverse proxy, PM2 para el proceso Node.js, PostgreSQL como base de datos. El frontend se buildea localmente (Vite) y se rsync al VPS. El backend se compila en el VPS con TypeScript.

**Principio clave**: El VPS tiene recursos limitados. No se ejecutan procesos pesados (build de frontend, compilaciones largas) en producción.

---

## Architecture Decisions

### 1. Nginx Reverse Proxy sobre Express Static
**Decisión**: Nginx sirve el frontend estático y proxy inverso para `/api/` y `/health`.

**Por qué**:
- Nginx maneja SSL termination de forma eficiente
- Cache de assets estáticos (CSS/JS) con headers de caché
- Separación de concerns: Nginx = web server, Node = API
- Certbot integra SSL directamente en Nginx

**Configuración**:
```
location /api/    → proxy_pass http://127.0.0.1:3003;
location /health  → proxy_pass http://127.0.0.1:3003;
location /        → root /var/www/RIOJAMAP/client/dist → SPA fallback
```

### 2. PM2 con ecosystem.config.cjs sobre systemd directo
**Decisión**: Usar PM2 con archivo ecosystem.config.cjs en el directorio del proyecto.

**Por qué**:
- `pm2 save` + `pm2 startup` = persiste después de reboot
- Logs separados por proyecto en `/var/log/pm2/`
- Política de reinicio en caso de crash (max_memory_restart)
- Consistente con los otros proyectos del VPS

**Importante**: Como `package.json` tiene `"type": "module"`, PM2 no puede leer `module.exports` en `.js`. La solución es usar extensión `.cjs`.

### 3. Base de datos dedicada con usuario propio
**Decisión**: Crear usuario `riojamap` y database `riojamap` con password dedicada.

**Por qué**:
- Aislamiento de otros proyectos en el mismo PostgreSQL
- Sigue el patrón existente (mvp, pdfmaster_user, nutri_admin)
- Sin riesgo de colisión de tablas

**Credenciales** (almacenadas solo en `/var/www/RIOJAMAP/server/.env`):
- `postgresql://riojamap:riojamap2026@localhost:5432/riojamap`

### 4. Puerto 3003 (no 3001)
**Decisión**: Backend corre en puerto 3003.

**Por qué**: El puerto 3001 está ocupado por `nutrilandingBackend` y el 3002 por el God Daemon de PM2. Los puertos disponibles verificados:

| Puerto | Proceso |
|--------|---------|
| 3000 | pdfgenerador-backend |
| 3001 | nutrilandingBackend |
| 3002 | PM2 God Daemon |
| 5000 | mvpsep-backend |
| **3003** | **→ riojamap-backend** |

---

## Infrastructure Diagram

```
Internet
   │
   │ DNS: riojamap.devlab1.online → 179.43.127.166
   ▼
Nginx (puerto 443 SSL / 80 → redirect)
   │
   ├── /api/* ──────────────────► Express :3003
   ├── /health ─────────────────► Express :3003
   └── /* ───► /var/www/RIOJAMAP/client/dist/index.html (SPA)
                                          │
                                    Express (PM2)
                                          │
                                    Prisma ORM
                                          │
                                    PostgreSQL 14
                                   (riojamap DB)
```

## Data Flow: HTTPS Request

```
1. Browser → GET https://riojamap.devlab1.online/api/obras?municipio=Capital
2. DNS → 179.43.127.166:443
3. Nginx: SSL termination
4. Nginx: proxy_pass http://127.0.0.1:3003/api/obras?municipio=Capital
5. Express → Prisma → PostgreSQL
6. Response ← JSON ← Nginx ← HTTPS ← Browser
```

---

## File Structure (Producción en VPS)

```
/var/www/RIOJAMAP/
├── ecosystem.config.cjs        # PM2 config (`.cjs` por ESM)
├── client/
│   └── dist/                   # Frontend build (rsync desde local)
│       ├── index.html
│       └── assets/
├── server/
│   ├── .env                    # DATABASE_URL producción
│   ├── dist/src/index.js       # Backend compilado
│   ├── node_modules/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── seed.ts                 # Script de seed (ejecutado una vez)
└── .git                        # Clonado desde GitHub
```

---

## Deployment Workflow

### Full Deploy (frontend + backend)
```bash
# 1. Local: build frontend
cd /home/lucas/docs/Code/RIOJAMAP
npm run build:client

# 2. Local: rsync a VPS
sshpass -p '<pass>' rsync -avz --delete \
  -e 'ssh -p5008' client/dist/ \
  root@179.43.127.166:/var/www/RIOJAMAP/client/dist/

# 3. Local: commit + push cambios backend
git add -A && git commit -m "..." && git push

# 4. VPS: pull + build + restart
ssh root@179.43.127.166 -p5008 "
  cd /var/www/RIOJAMAP && git pull
  cd server && npm run build
  pm2 restart riojamap-backend
"
```

### Backend-only Deploy
```bash
sshpass -p '<pass>' ssh -p5008 root@179.43.127.166 "
  cd /var/www/RIOJAMAP && git pull
  cd server && npm run build
  pm2 restart riojamap-backend
"
```

### Frontend-only Deploy
```bash
npm run build:client
sshpass -p '<pass>' rsync -avz --delete \
  -e 'ssh -p5008' client/dist/ \
  root@179.43.127.166:/var/www/RIOJAMAP/client/dist/
```

---

## Monitoring & Maintenance

### Comandos útiles
```bash
# Ver estado
pm2 status
pm2 show riojamap-backend

# Ver logs
pm2 logs riojamap-backend --lines 50

# Health check
curl https://riojamap.devlab1.online/health

# Ver DB
su - postgres -c "psql -d riojamap -c 'SELECT COUNT(*) FROM \"Obra\";'"

# Ver SSL expiry
openssl s_client -connect riojamap.devlab1.online:443 \
  -servername riojamap.devlab1.online < /dev/null 2>/dev/null \
  | openssl x509 -noout -enddate
```

### SSL Auto-renewal
Certbot configura automáticamente un timer systemd:
```bash
systemctl status certbot.timer
```

---

## Environment Configuration

| Variable | Local Dev | Producción |
|----------|-----------|------------|
| `DATABASE_URL` | `postgresql://postgres:snorlax2@localhost:5432/riojamap` | `postgresql://riojamap:riojamap2026@localhost:5432/riojamap` |
| `PORT` | 3001 (default) | 3003 (via PM2 env) |
| `NODE_ENV` | - | `production` |
| CORS origins | `localhost:5173, localhost:3000` | + `https://riojamap.devlab1.online` |

---

## Open Questions (Resueltas)

1. ~~**Seed data format**: User provided 44 records en seed.ts~~ → ✅ Resuelto, datos embebidos en el script
2. ~~**Puerto conflict**: 3001 ocupado~~ → ✅ Cambiado a 3003
3. ~~**PM2 + ESM**: ecosystem.config.js falla con "type": "module"~~ → ✅ Renombrado a .cjs
4. ~~**DB credentials**: Dónde crear el usuario~~ → ✅ Patrón existente: usuario dedicado con password propia
