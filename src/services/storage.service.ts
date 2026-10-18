import { getSupabaseClient } from '../config/supabase';

const STORAGE_BUCKET = 'DocumentosIA';

export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(key, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`No se pudo subir el archivo a Supabase Storage: ${error.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(key);

  return data.publicUrl;
}
