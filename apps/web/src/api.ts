export async function api<T>(path:string,body?:unknown,key=crypto.randomUUID()):Promise<T>{
 const options:RequestInit={credentials:'include',headers:body===undefined?{}:{'Content-Type':'application/json','Idempotency-Key':key},...(body===undefined?{}:{method:'POST',body:JSON.stringify(body)})};
 let response:Response;
 try { response=await fetch('/api'+path,options); } catch { response=await fetch('/api'+path,options); }
 const data=await response.json();
 if(!response.ok) throw new Error(data.error?.message||data.error||data.message||'Não foi possível completar a ação.');
 return data as T;
}
