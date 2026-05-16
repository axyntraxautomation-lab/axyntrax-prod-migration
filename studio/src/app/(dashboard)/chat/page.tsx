'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

export default function ChatPage() {
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: 'Hola Gerente, soy Cecilia Master. Hoy tienes 3 módulos activos y S/ 1,990 en ingresos. ¿En qué te ayudo?' },
  ]);
  return (
    <div className="flex flex-col h-[80vh]">
      <h1 className="text-2xl font-bold mb-4">Cecilia Master</h1>
      <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto mb-4">
        {chat.map((c, i) => (<div key={i} className={`mb-3 ${c.role === 'user' ? 'text-right' : ''}`}><span className={`inline-block px-4 py-2 rounded-lg text-sm ${c.role === 'user' ? 'bg-cyan-600' : 'bg-gray-800'}`}>{c.content}</span></div>))}
      </div>
      <div className="flex gap-2">
        <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escribe a Cecilia..." />
        <Button><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
