import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'server/prisma/schema.prisma',
  datasource: {
    // Use unpooled (direct) connection for CLI commands (db push, migrate)
    url: env('DATABASE_URL_UNPOOLED'),
  },
});
