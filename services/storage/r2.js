// Cloudflare R2 object storage for lesson-recording audio.
//
// R2 is S3-compatible, so we use the AWS S3 SDK pointed at the R2 endpoint.
// The SDK is imported LAZILY (dynamic import inside each call) so this module
// can be required in environments where the SDK isn't installed yet — only
// actually calling a function requires it. Audio is served via short-lived
// SIGNED URLs minted per request; we never persist a public URL.
//
// Required env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
// R2_BUCKET, R2_ENDPOINT (e.g. https://<account>.r2.cloudflarestorage.com).

let _clientPromise = null;

async function getClient() {
  if (!_clientPromise) {
    _clientPromise = (async () => {
      const { S3Client } = await import('@aws-sdk/client-s3');
      return new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });
    })();
  }
  return _clientPromise;
}

function bucket() {
  return process.env.R2_BUCKET;
}

// Upload a finalised audio blob. Returns the opaque storage key.
export async function putAudioObject(key, body, contentType = 'audio/webm') {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = await getClient();
  await client.send(new PutObjectCommand({
    Bucket: bucket(), Key: key, Body: body, ContentType: contentType,
  }));
  return key;
}

// Mint a short-lived signed GET url for an audio object.
export async function getSignedDownloadUrl(key, ttlSeconds = 300) {
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  const client = await getClient();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn: ttlSeconds });
}

export async function deleteObject(key) {
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  const client = await getClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

// Default object export so routes can call r2.getSignedDownloadUrl(...) and
// tests can mock the methods on a single import.
export default { putAudioObject, getSignedDownloadUrl, deleteObject };
