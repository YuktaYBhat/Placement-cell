Write-Host "📦 Installing dependencies..."
pnpm install

Write-Host "🔧 Generating Prisma client..."
pnpm prisma generate

Write-Host "🗄️  Applying migrations..."
pnpm prisma migrate deploy

Write-Host "🌱 Seeding database..."
pnpm prisma db seed

Write-Host "🚀 Starting dev server..."
pnpm dev
