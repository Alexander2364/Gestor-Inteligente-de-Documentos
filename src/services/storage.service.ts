import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const REQUIRED_S3_VARS = [
  'S3_ENDPOINT',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'S3_BUCKET',
] as const;

type S3EnvironmentVariable = typeof REQUIRED_S3_VARS[number];

function getS3Config(): Record<S3EnvironmentVariable, string> {
  const missing = REQUIRED_S3_VARS.filter((variable) => !process.env[variable]);

  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno S3: ${missing.join(', ')}`);
  }

  return {
    S3_ENDPOINT: process.env.S3_ENDPOINT!,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY!,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY!,
    S3_BUCKET: process.env.S3_BUCKET!,
  };
}

export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const config = getS3Config();
  const client = new S3Client({
    endpoint: config.S3_ENDPOINT,
    region: 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.S3_ACCESS_KEY,
      secretAccessKey: config.S3_SECRET_KEY,
    },
  });

  await client.send(new PutObjectCommand({
    Bucket: config.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return key;
}