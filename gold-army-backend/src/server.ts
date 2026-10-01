import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { startExpiryJob } from './jobs/expiry';

const server = app.listen(env.PORT, '0.0.0.0', () => console.log(`Gold Army API listening on http://0.0.0.0:${env.PORT} (${env.API_URL})`));
const expiryTimer = startExpiryJob();

async function shutdown(signal: string) { console.log(`${signal}: shutting down`); clearInterval(expiryTimer); server.close(async () => { await prisma.$disconnect(); process.exit(0); }); }
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
