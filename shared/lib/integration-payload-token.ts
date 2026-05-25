"use client";

export type IntegrationPayloadPublicKey = {
  alg: "ECDH-ES+A256GCM";
  kid: string;
  prefix: "ip2";
  publicKey: string;
};

export type SealIntegrationPayloadTokenOptions = {
  catalogId?: string | null;
  expiresInSeconds?: number | null;
  type?: string | null;
};

const TOKEN_VERSION = 1;
const AES_GCM_IV_BYTES = 12;
const ECDH_CURVE = "P-256";
const HKDF_SALT_TEXT = "integration-payload-token:ip2:salt";
const HKDF_INFO_TEXT = "integration-payload-token:ip2:a256gcm";

export async function sealIntegrationPayloadToken(
  payload: unknown,
  publicKey: IntegrationPayloadPublicKey,
  options: SealIntegrationPayloadTokenOptions = {},
): Promise<string> {
  if (publicKey.alg !== "ECDH-ES+A256GCM" || publicKey.prefix !== "ip2") {
    throw new Error("Unsupported integration payload key algorithm.");
  }

  const crypto = getBrowserCrypto();
  const serverPublicKeyRaw = fromBase64Url(publicKey.publicKey);
  const serverPublicKey = await importEcdhPublicKey(serverPublicKeyRaw);
  const ephemeralKeyPair = await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: ECDH_CURVE,
    },
    true,
    ["deriveBits"],
  );
  const ephemeralPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", ephemeralKeyPair.publicKey),
  );
  const sharedSecret = await crypto.subtle.deriveBits(
    {
      name: "ECDH",
      public: serverPublicKey,
    },
    ephemeralKeyPair.privateKey,
    256,
  );
  const contentKey = await deriveContentKey(sharedSecret);
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));
  const plaintext = new TextEncoder().encode(
    JSON.stringify(buildEnvelope(payload, options)),
  );
  const encryptedPayload = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    contentKey,
    plaintext,
  );

  return [
    publicKey.prefix,
    publicKey.kid,
    toBase64Url(ephemeralPublicKeyRaw),
    toBase64Url(iv),
    toBase64Url(new Uint8Array(encryptedPayload)),
  ].join(".");
}

function buildEnvelope(
  payload: unknown,
  options: SealIntegrationPayloadTokenOptions,
): Record<string, unknown> {
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = normalizePositiveInt(options.expiresInSeconds);
  const envelope: Record<string, unknown> = {
    v: TOKEN_VERSION,
    iat: now,
    p: payload,
  };
  const type = normalizeText(options.type);
  const catalogId = normalizeText(options.catalogId);

  if (type) envelope.t = type;
  if (catalogId) envelope.c = catalogId;
  if (expiresInSeconds) envelope.exp = now + expiresInSeconds;

  return envelope;
}

async function importEcdhPublicKey(publicKeyRaw: Uint8Array): Promise<CryptoKey> {
  const crypto = getBrowserCrypto();
  return crypto.subtle.importKey(
    "raw",
    toArrayBuffer(publicKeyRaw),
    {
      name: "ECDH",
      namedCurve: ECDH_CURVE,
    },
    false,
    [],
  );
}

async function deriveContentKey(sharedSecret: ArrayBuffer): Promise<CryptoKey> {
  const crypto = getBrowserCrypto();
  const encoder = new TextEncoder();
  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    "HKDF",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: toArrayBuffer(encoder.encode(HKDF_SALT_TEXT)),
      info: toArrayBuffer(encoder.encode(HKDF_INFO_TEXT)),
    },
    hkdfKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt"],
  );
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getBrowserCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error("WebCrypto is not available in this browser.");
  }

  return globalThis.crypto;
}

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizePositiveInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : null;
}
