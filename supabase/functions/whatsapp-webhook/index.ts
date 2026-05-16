import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const V=Deno.env.get("WEBHOOK_VERIFY_TOKEN")!;
const T=Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const P=Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const K=Deno.env.get("DEEPSEEK_API_KEY")!;
const sp="Eres Cecilia, asesora senior de Axyntrax Automation. Tono profesional, cálido y elegante. NUNCA métricas ni ingresos. Máximo 2 opciones por mensaje. Preguntas de sondeo.";

async function ceciliaReply(msg:string):Promise<string>{
  const r=await fetch("https://api.deepseek.com/v1/chat/completions",{
    method:"POST",
    headers:{Authorization:`Bearer ${K}`,"Content-Type":"application/json"},
    body:JSON.stringify({model:"deepseek-chat",messages:[{role:"system",content:sp},{role:"user",content:msg}]})
  });
  const d=await r.json();
  return d?.choices?.[0]?.message?.content||"Disculpe, ¿podría repetir la pregunta?";
}

async function sendMsg(channel:string,to:string,text:string){
  if(channel==="whatsapp"){
    await fetch(`https://graph.facebook.com/v18.0/${P}/messages`,{
      method:"POST",
      headers:{Authorization:`Bearer ${T}`,"Content-Type":"application/json"},
      body:JSON.stringify({messaging_product:"whatsapp",to,text:{body:text}})
    });
  }else if(channel==="messenger"||channel==="instagram"){
    await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${T}`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({recipient:{id:to},message:{text}})
    });
  }
}

serve(async(req:Request)=>{
  const u=new URL(req.url);
  if(req.method==="GET"){
    const mode=u.searchParams.get("hub.mode");
    const token=u.searchParams.get("hub.verify_token");
    const challenge=u.searchParams.get("hub.challenge");
    if(mode==="subscribe"&&token===V)return new Response(challenge,{status:200});
    return new Response("Error",{status:403});
  }
  if(req.method==="POST"){
    try{
      const body=await req.json();
      if(body.object==="page"||body.object==="instagram"){
        for(const entry of body.entry||[]){
          for(const event of entry.messaging||[]){
            const sender=event.sender?.id;
            const text=event.message?.text;
            if(sender&&text){
              const reply=await ceciliaReply(text);
              await sendMsg("messenger",sender,reply);
            }
          }
        }
      }else if(body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]){
        const msg=body.entry[0].changes[0].value.messages[0];
        const from=msg.from;
        const text=msg.text?.body||"";
        if(from&&text){
          const reply=await ceciliaReply(text);
          await sendMsg("whatsapp",from,reply);
        }
      }
      return new Response(JSON.stringify({status:"ok"}),{status:200});
    }catch(e){
      return new Response(JSON.stringify({error:e.message}),{status:500});
    }
  }
  return new Response("Method not allowed",{status:405});
});
