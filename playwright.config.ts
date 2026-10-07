import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/e2e',timeout:120_000,expect:{timeout:15_000},fullyParallel:false,workers:1,
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://localhost:5173',viewport:{width:1366,height:768},trace:'retain-on-failure',screenshot:'only-on-failure'},
 webServer:[
  {command:'pnpm --filter @cryptidle/server start',url:'http://localhost:3000/api/health',reuseExistingServer:!process.env.CI,timeout:60_000,env:{NODE_ENV:'test',APP_ORIGIN:'http://localhost:5173',BETTER_AUTH_SECRET:process.env.BETTER_AUTH_SECRET||'isolated-e2e-test-secret-at-least-32-characters'}},
  {command:'pnpm --filter @cryptidle/web dev',url:'http://localhost:5173',reuseExistingServer:!process.env.CI,timeout:60_000}
 ]
});
