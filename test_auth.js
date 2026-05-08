import { db } from './lib/db/src/index.ts';
import { usersTable } from './lib/db/src/schema/users.ts';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config();

async function testAuth() {
  console.log('Probando autenticación con Supabase...');
  try {
    const user = await db.select().from(usersTable).where(eq(usersTable.email, 'axyntraxautomation@gmail.com')).limit(1);
    if (user.length > 0) {
      console.log('✅ Éxito: Usuario encontrado en Supabase.');
      console.log('Nombre:', user[0].name);
      console.log('Rol:', user[0].role);
    } else {
      console.log('❌ Error: Usuario no encontrado.');
    }
  } catch (err) {
    console.error('❌ Error fatal:', err.message);
  }
}

testAuth();
