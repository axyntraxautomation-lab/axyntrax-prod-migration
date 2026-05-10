'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <Card className="w-96 bg-gray-900 border-gray-800">
        <CardHeader><CardTitle className="text-white text-center">AXYNTRAX</CardTitle></CardHeader>
        <CardContent>
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-3" />
          <Input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-4" />
          <Button className="w-full">Entrar</Button>
        </CardContent>
      </Card>
    </div>
  );
}
