// axyntrax_node_mvp/src/services/db.js
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
module.exports = supabase;

// axyntrax_node_mvp/src/services/ia.js
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

async function chatCecilia(prompt, history) {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "system", content: prompt }, ...history],
  });
  return completion.choices[0].message.content;
}
module.exports = { chatCecilia };
