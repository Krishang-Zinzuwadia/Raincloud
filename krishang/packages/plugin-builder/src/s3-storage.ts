import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getS3Bucket, getS3Prefix } from "./s3-config";

const s3 = new S3Client({});

function isMissing(error: unknown): boolean {
  const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return err.name === "NotFound" || err.$metadata?.httpStatusCode === 404;
}

export async function putWriteOnce(
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<string> {
  const bucket = getS3Bucket();
  const prefix = getS3Prefix();
  const Key = `${prefix}${key}`;

  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key }));
    throw new Error(`write-once object already exists: ${Key}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("write-once")) throw error;
    if (!isMissing(error)) throw error;
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key,
      Body: body,
      ContentType: contentType,
      CacheControl: "no-store",
      ObjectLockMode: "GOVERNANCE",
      ObjectLockRetainUntilDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    })
  );

  return `s3://${bucket}/${Key}`;
}

export async function uploadPluginJson(key: string, json: object) {
  return putWriteOnce(key, Buffer.from(JSON.stringify(json), "utf8"), "application/json");
}

export async function uploadPluginJar(key: string, jar: Uint8Array) {
  return putWriteOnce(key, jar, "application/java-archive");
}
