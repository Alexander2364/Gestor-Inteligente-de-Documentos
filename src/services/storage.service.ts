import { getSupabaseClient } from '../config/supabase';
import { getStorageBucket } from '../config/storage';

export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const supabase = getSupabaseClient();
  const bucket = getStorageBucket();
  const { error } = await supabase.storage.from(bucket).upload(key, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`No se pudo subir el archivo a Supabase Storage: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(key);

  return data.publicUrl;
}
