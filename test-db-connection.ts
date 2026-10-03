import 'dotenv/config';
import { getSupabaseClient } from './src/config/supabase';

async function testConnection() {
  console.log('🔌 Iniciando prueba de conexión a Supabase...\n');

  try {
    // 1. Obtener el cliente (esto validará que las variables de entorno existan)
    const supabase = getSupabaseClient();
    console.log('✅ Cliente de Supabase inicializado correctamente.');

    // 2. Prueba de lectura: Intentar contar los registros de la tabla 'documents'
    const { count, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Error al consultar la tabla 'documents': ${countError.message}`);
    }
    console.log(`✅ Lectura exitosa. Registros actuales en 'documents': ${count}`);

    // 3. Prueba de escritura: Insertar un documento de prueba
    const testDoc = {
      file_name: 'prueba_conexion_automatizada.pdf',
      processing_status: 'completed',
      upload_date: new Date().toISOString(),
    };

    const { data: insertData, error: insertError } = await supabase
      .from('documents')
      .insert([testDoc])
      .select();

    if (insertError) {
      throw new Error(`Error al insertar en 'documents': ${insertError.message}`);
    }
    console.log('✅ Inserción exitosa. Documento de prueba creado con ID:', insertData[0].id);

    // 4. Limpieza: Eliminar el documento de prueba para no ensuciar la base de datos
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', insertData[0].id);

    if (deleteError) {
      console.warn('⚠️ No se pudo eliminar el documento de prueba, pero la conexión fue exitosa.');
    } else {
      console.log(' Documento de prueba eliminado correctamente.');
    }

    console.log('\n🎉 ¡Todas las pruebas de conexión y operaciones básicas fueron exitosas!');

  } catch (error) {
    console.error('\n❌ FALLO EN LA PRUEBA DE CONEXIÓN:');
    if (error instanceof Error) {
      console.error(`-> ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

testConnection();