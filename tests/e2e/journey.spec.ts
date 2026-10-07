import {test,expect,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {prisma} from '../../apps/server/src/db';
import type {Character,BossRoom} from '../../packages/shared/src/index';

if(!process.env.DATABASE_URL?.includes('cryptidle_test'))throw new Error('E2E requires isolated cryptidle_test database');
const unique=Date.now().toString(36);
async function dismiss(page:Page){const summary=page.getByRole('button',{name:'Continuar a jornada'});if(await summary.isVisible())await summary.click();const close=page.getByRole('button',{name:'Fechar aviso'});if(await close.isVisible())await close.click();}
async function register(page:Page,name:string,cl:string){
 await page.goto('/');await page.getByRole('button',{name:'Primeira visita? Criar conta'}).click();
 await page.getByLabel('Seu nome',{exact:true}).fill(name);await page.getByLabel('E-mail',{exact:true}).fill(`${name}@example.test`);await page.getByLabel('Senha',{exact:true}).fill('E2e-example-long-password!');
 await page.getByRole('button',{name:'Criar conta',exact:true}).click();
 await page.getByLabel('Nome do personagem',{exact:true}).fill(name);await page.locator(`input[name="classId"][value="${cl}"]`).check();
 await page.getByRole('button',{name:'Entrar em Cinzabrasa'}).click();await expect(page.getByText('SEU VIAJANTE')).toBeVisible();await dismiss(page);
}
async function advanceHunt(page:Page,name:string){
 await page.getByRole('button',{name:/Bosque das Cinzas/}).click();
 await expect(page.locator('.hunt-status')).toHaveText('Caça automática');
 // Close the game surface before moving the persisted server timestamp: no polling race.
 await page.goto('about:blank');
 const row=await prisma.character.findFirstOrThrow({where:{name}});const c=row.data as unknown as Character;
 await prisma.character.update({where:{id:row.id},data:{data:JSON.parse(JSON.stringify({...c,lastSettledAt:Date.now()-30*60_000}))}});
 await page.goto('/');await expect(page.getByRole('dialog',{name:'Resumo da jornada'})).toBeVisible();await page.getByRole('button',{name:'Continuar a jornada'}).click();
 await page.getByRole('button',{name:/Cinzabrasa.*Cidade/}).click();await dismiss(page);
}
test.afterAll(async()=>{await prisma.$disconnect();});
test('two real accounts hunt, equip, trade, chat and complete the same boss',async({browser})=>{
 const a=await browser.newContext(),b=await browser.newContext();const page=await a.newPage(),friend=await b.newPage();
 const consoleErrors:string[]=[];for(const p of [page,friend]){p.on('pageerror',e=>consoleErrors.push(e.message));p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});}
 const name=`Ash${unique}`,other=`Lux${unique}`;
 await register(page,name,'warrior');await register(friend,other,'priest');
 mkdirSync('docs/evidence',{recursive:true});await page.screenshot({path:'docs/evidence/town-1366.png',fullPage:true});
 await advanceHunt(page,name);await advanceHunt(friend,other);
 const marsh=page.getByRole('button',{name:/Pântano dos Sussurros/});await expect(marsh).toBeEnabled();await marsh.click();await expect(page.locator('.location h1')).toHaveText('Pântano dos Sussurros');
 await page.getByRole('button',{name:/Cinzabrasa.*Cidade/}).click();await dismiss(page);
 await page.getByRole('button',{name:'Aparência & conquistas'}).click();await expect(page.getByText(/50 \/ 50/)).toBeVisible();await page.getByRole('button',{name:'Usar aparência'}).click();await expect(page.getByText('Em uso')).toBeVisible();await page.getByRole('button',{name:'Fechar janela'}).click();await dismiss(page);
 await page.getByRole('button',{name:/^Inventário/}).click();
 const inventoryItem=page.locator('.inventory-slot').first();await expect(inventoryItem).toBeVisible();await inventoryItem.click();
 await page.getByRole('button',{name:'Equipar',exact:true}).click();
 await expect(page.getByRole('button',{name:'Desequipar',exact:true})).toBeVisible();await page.screenshot({path:'docs/evidence/inventory-1366.png',fullPage:true});
 await page.getByRole('button',{name:'Desequipar',exact:true}).click();await page.getByRole('button',{name:'Fechar janela'}).click();
 await page.getByRole('button',{name:'Mercado',exact:true}).click();
 const item=await page.getByLabel('Item para anunciar').locator('option').nth(1).getAttribute('value');expect(item).toBeTruthy();
 await page.getByLabel('Item para anunciar').selectOption(item!);await page.getByLabel('Preço em gold').fill('20');await page.getByRole('button',{name:'Anunciar',exact:true}).click();await expect(page.getByRole('button',{name:'Cancelar',exact:true})).toBeVisible();
 await friend.getByRole('button',{name:'Mercado',exact:true}).click();await friend.getByRole('button',{name:'20 gold · Comprar',exact:true}).first().click();
 const buyer=await prisma.character.findFirstOrThrow({where:{name:other}});await expect.poll(async()=> (await prisma.item.findUniqueOrThrow({where:{id:item!}})).ownerId).toBe(buyer.id);
 await friend.getByRole('button',{name:'Fechar janela'}).click();await page.getByRole('button',{name:'Fechar janela'}).click();await dismiss(page);await dismiss(friend);
 await page.getByLabel('Mensagem global').fill(`Ao eclipse, ${unique}!`);await page.getByRole('button',{name:'Enviar mensagem'}).click();await expect(friend.getByRole('log')).toContainText(`Ao eclipse, ${unique}!`);
 await page.getByRole('button',{name:'Expedição',exact:true}).click();await page.getByRole('button',{name:'Criar expedição',exact:true}).click();
 const code=(await page.locator('.room-heading b').textContent())!;
 await friend.getByRole('button',{name:'Expedição',exact:true}).click();await friend.getByLabel('Código da sala').fill(code);await friend.getByRole('button',{name:'Entrar por código'}).click();
 await friend.getByRole('button',{name:'Estou pronto'}).click();await page.getByRole('button',{name:'Estou pronto'}).click();await expect(page.getByRole('button',{name:'Iniciar expedição'})).toBeEnabled();await page.getByRole('button',{name:'Iniciar expedição'}).click();
 await expect(page.getByText('Enfrentando o Guardião',{exact:true})).toBeVisible();
 const room=await prisma.bossRoom.findUniqueOrThrow({where:{code}});const data=room.data as unknown as BossRoom;
 await prisma.bossRoom.update({where:{id:room.id},data:{data:JSON.parse(JSON.stringify({...data,startedAt:Date.now()-65_000,endsAt:Date.now()-1000}))}});
 await expect(page.getByText('Vitória!',{exact:true})).toBeVisible();await expect(friend.getByText('Vitória!',{exact:true})).toBeVisible();
 await expect.poll(()=>prisma.bossReward.count({where:{roomId:room.id}})).toBe(2);
 await dismiss(page);await dismiss(friend);
 await page.screenshot({path:'docs/evidence/boss-1366.png',fullPage:true});await page.reload();await expect(page.getByText('SEU VIAJANTE')).toBeVisible();expect(await prisma.bossReward.count({where:{roomId:room.id}})).toBe(2);
 await page.getByRole('button',{name:/Bosque das Cinzas/}).click();await dismiss(page);await page.screenshot({path:'docs/evidence/hunt-1366.png',fullPage:true});
 await page.setViewportSize({width:1920,height:1080});await page.screenshot({path:'docs/evidence/hunt-1920.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/evidence/mobile-390.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(consoleErrors).toEqual([]);await a.close();await b.close();
});
