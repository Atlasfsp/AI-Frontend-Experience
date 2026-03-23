import { BacSessionSchema, isSessionExpired } from './session';

function base64UrlEncode(value: string) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf8').toString('base64url');
  }

  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlEncodeBytes(value: Uint8Array) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value).toString('base64url');
  }

  let binary = '';
  value.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64url').toString('utf8');
  }

  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function importKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function createSignedSessionToken(
  session: unknown,
  secret: string,
): Promise<string> {
  const payload = base64UrlEncode(JSON.stringify(BacSessionSchema.parse(session)));
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;
}

export async function verifySignedSessionToken(
  token: string | undefined,
  secret: string,
) {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split('.');

  if (!payload || !signature) {
    return null;
  }

  try {
    const key = await importKey(secret);
    const verified = await crypto.subtle.verify(
      'HMAC',
      key,
      Uint8Array.from(
        atob(signature.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(signature.length / 4) * 4, '=')),
        (character) => character.charCodeAt(0),
      ),
      new TextEncoder().encode(payload),
    );

    if (!verified) {
      return null;
    }

    const parsed = BacSessionSchema.parse(JSON.parse(base64UrlDecode(payload)));
    return isSessionExpired(parsed) ? null : parsed;
  } catch {
    return null;
  }
}
