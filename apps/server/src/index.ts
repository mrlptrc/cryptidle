import { createApp } from './app.js';
import { prisma } from './db.js';
const app=await createApp({logger:true});
await app.listen({port:Number(process.env.PORT||3000),host:'0.0.0.0'});
for(const signal of ['SIGTERM','SIGINT'] as const) process.on(signal,()=>{void app.close().then(()=>prisma.$disconnect()).then(()=>process.exit(0));});
