import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variables requeridas para la conexión a Supabase en el Backend
const REQUIRED_SUPABASE_VARS = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY'] as const;

type RequiredSupabaseVar = typeof REQUIRED_SUPABASE_VARS[number];

export function validateSupabaseEnv(): void {
    const missing: string[] = [];
    
    for ( const varName of REQUIRED_SUPABASE_VARS ) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }
    
    if (missing.length > 0) {
        console.error('❌ Variables de entorno de Supabase faltantes:');
        missing.forEach(v => console.error(`   - ${v}`));
        console.error('\n💡 Configura tu proyecto de Supabase y agrega las credenciales a tu archivo .env local.');
        process.exit(1);
    }
}

let supabaseClientInstance: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
    if (!supabaseClientInstance) {
        validateSupabaseEnv();
        
        supabaseClientInstance = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!, // Usamos la clave secreta (service_role)
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );
    }
    return supabaseClientInstance;
}

/* 
 * NOTA DE SEGURIDAD:
 * Usamos SUPABASE_SECRET_KEY (service_role) en el backend.
 * Esto permite que el servidor realice operaciones administrativas 
 * (insertar, actualizar, eliminar) omitiendo las Reglas de Seguridad 
 * de Nivel de Fila (RLS). NUNCA expongas esta clave en el frontend.
 */