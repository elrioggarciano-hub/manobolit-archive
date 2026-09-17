import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  // Migrate/introspect need the direct (non-pooled) connection; the app itself
  // connects via the PrismaPg adapter using the pooled DATABASE_URL instead.
  datasource: {
    url: process.env.DIRECT_URL,
  },
})
