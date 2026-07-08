#!/bin/bash

echo "=== Backend Foundation Verification ==="
echo ""

# Check 1: Verify file structure
echo "1. Checking file structure..."
FILES=(
  "server/package.json"
  "server/tsconfig.json"
  "server/prisma/schema.prisma"
  "server/src/index.ts"
  "server/src/routes/obras.ts"
  "server/src/schemas/obra.ts"
  "server/seed.ts"
  ".env"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file NOT FOUND"
  fi
done

echo ""
echo "2. Checking Prisma client generation..."
if [ -d "server/node_modules/@prisma/client" ]; then
  echo "   ✅ Prisma client generated"
else
  echo "   ❌ Prisma client NOT generated"
fi

echo ""
echo "3. Checking TypeScript compilation..."
cd server
if npx tsc --noEmit 2>&1 | grep -q "error"; then
  echo "   ❌ TypeScript compilation FAILED"
  npx tsc --noEmit
else
  echo "   ✅ TypeScript compiles successfully"
fi
cd ..

echo ""
echo "=== Next Steps ==="
echo "1. Start PostgreSQL: docker-compose up -d (or manually)"
echo "2. Run migration: npm run db:migrate"
echo "3. Seed database: npm run db:seed"
echo "4. Start server: npm run dev:server"
echo "5. Test endpoints:"
echo "   curl http://localhost:3001/health"
echo "   curl http://localhost:3001/api/obras"
echo "   curl http://localhost:3001/api/obras/kpis"
echo "   curl 'http://localhost:3001/api/obras?municipio=Capital'"
