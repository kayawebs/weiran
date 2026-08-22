import { createHash } from "node:crypto";

/*
 * The a_bogus signing routine is adapted from jiuhunwl/short_videos
 * (MIT, Copyright <2025> <jiuhunwl>). See THIRD_PARTY_NOTICES.md.
 */

const alphabets = {
  s3: "ckdp1h4ZKsUB80/Mfvw36XIgR25+WQAlEi7NLboqYTOPuzmFjJnryx9HVGDaStCe",
  s4: "Dkdpgh2ZmsQB80/MfvV36XI1R45-WUAlEixNLwoqYTOPuzKFjJnry79HbGcaStCe"
} as const;

function rc4Encrypt(plaintext: string, key: string): string {
  const state = Array.from({ length: 256 }, (_, index) => index);
  let j = 0;
  for (let i = 0; i < 256; i += 1) {
    j = (j + (state[i] ?? 0) + key.charCodeAt(i % key.length)) % 256;
    [state[i], state[j]] = [state[j] ?? 0, state[i] ?? 0];
  }

  let i = 0;
  j = 0;
  const output: string[] = [];
  for (let cursor = 0; cursor < plaintext.length; cursor += 1) {
    i = (i + 1) % 256;
    j = (j + (state[i] ?? 0)) % 256;
    [state[i], state[j]] = [state[j] ?? 0, state[i] ?? 0];
    const stateIndex = ((state[i] ?? 0) + (state[j] ?? 0)) % 256;
    output.push(String.fromCharCode((state[stateIndex] ?? 0) ^ plaintext.charCodeAt(cursor)));
  }
  return output.join("");
}

function sm3(input: string | Uint8Array): number[] {
  return [...createHash("sm3").update(input).digest()];
}

function encodeTriplets(value: string, alphabet: keyof typeof alphabets): string {
  const chars = alphabets[alphabet];
  let output = "";
  for (let offset = 0; offset < value.length; offset += 3) {
    const long = (value.charCodeAt(offset) << 16)
      | (value.charCodeAt(offset + 1) << 8)
      | value.charCodeAt(offset + 2);
    output += chars[(long & 16_515_072) >> 18] ?? "";
    output += chars[(long & 258_048) >> 12] ?? "";
    output += chars[(long & 4_032) >> 6] ?? "";
    output += chars[long & 63] ?? "";
  }
  return output;
}

function interleaveRandom(random: number, option: readonly [number, number]): number[] {
  return [
    ((random & 255 & 170) | (option[0] & 85)) >>> 0,
    ((random & 255 & 85) | (option[0] & 170)) >>> 0,
    ((((random >> 8) & 255) & 170) | (option[1] & 85)) >>> 0,
    ((((random >> 8) & 255) & 85) | (option[1] & 170)) >>> 0
  ];
}

function generateRandomPrefix(): string {
  const bytes = [
    ...interleaveRandom(Math.random() * 10_000, [3, 45]),
    ...interleaveRandom(Math.random() * 10_000, [1, 0]),
    ...interleaveRandom(Math.random() * 10_000, [1, 5])
  ];
  return String.fromCharCode(...bytes);
}

function generatePayload(
  searchParams: string,
  userAgent: string,
  windowEnvironment = "1536|747|1536|834|0|30|0|0|1536|834|1536|864|1525|747|24|24|Win32"
): string {
  const startTime = Date.now();
  const queryHash = sm3(Uint8Array.from(sm3(`${searchParams}cus`)));
  const suffixHash = sm3(Uint8Array.from(sm3("cus")));
  const encodedUa = encodeTriplets(rc4Encrypt(userAgent, String.fromCharCode(0, 1, 14)), "s3");
  const uaHash = sm3(encodedUa);
  const endTime = Date.now();
  const values: Record<number, number> = {
    8: 3,
    10: endTime,
    16: startTime,
    18: 44,
    20: (startTime >> 24) & 255,
    21: (startTime >> 16) & 255,
    22: (startTime >> 8) & 255,
    23: startTime & 255,
    24: Math.floor(startTime / 256 ** 4),
    25: Math.floor(startTime / 256 ** 5),
    26: 0,
    27: 0,
    28: 0,
    29: 0,
    30: 0,
    31: 1,
    32: 0,
    33: 0,
    34: 0,
    35: 0,
    36: 0,
    37: 14,
    38: queryHash[21] ?? 0,
    39: queryHash[22] ?? 0,
    40: suffixHash[21] ?? 0,
    41: suffixHash[22] ?? 0,
    42: uaHash[23] ?? 0,
    43: uaHash[24] ?? 0,
    44: (endTime >> 24) & 255,
    45: (endTime >> 16) & 255,
    46: (endTime >> 8) & 255,
    47: endTime & 255,
    48: 3,
    49: Math.floor(endTime / 256 ** 4),
    50: Math.floor(endTime / 256 ** 5),
    52: (6241 >> 24) & 255,
    53: (6241 >> 16) & 255,
    54: (6241 >> 8) & 255,
    55: 6241 & 255,
    57: 6383 & 255,
    58: (6383 >> 8) & 255,
    59: (6383 >> 16) & 255,
    60: (6383 >> 24) & 255,
    70: 0,
    71: 0
  };
  const environmentBytes = [...windowEnvironment].map((character) => character.charCodeAt(0));
  values[65] = environmentBytes.length & 255;
  values[66] = (environmentBytes.length >> 8) & 255;

  const checksumIndexes = [
    18, 20, 26, 30, 38, 40, 42, 21, 27, 31, 35, 39, 41, 43, 22, 28, 32, 36,
    23, 29, 33, 37, 44, 45, 46, 47, 48, 49, 50, 24, 25, 52, 53, 54, 55, 57,
    58, 59, 60, 65, 66, 70, 71
  ];
  const checksum = checksumIndexes.reduce((result, index) => result ^ (values[index] ?? 0), 0);
  const payloadIndexes = [
    18, 20, 52, 26, 30, 34, 58, 38, 40, 53, 42, 21, 27, 54, 55, 31, 35, 57,
    39, 41, 43, 22, 28, 32, 60, 36, 23, 29, 33, 37, 44, 45, 59, 46, 47, 48,
    49, 50, 24, 25, 65, 66, 70, 71
  ];
  const payload = [...payloadIndexes.map((index) => values[index] ?? 0), ...environmentBytes, checksum];
  return rc4Encrypt(String.fromCharCode(...payload), String.fromCharCode(121));
}

export function generateDouyinABogus(searchParams: string, userAgent: string): string {
  return `${encodeTriplets(generateRandomPrefix() + generatePayload(searchParams, userAgent), "s4") }=`;
}

export function generateDouyinMsToken(length = 107): string {
  const alphabet = "ABCDEFGHIGKLMNOPQRSTUVWXYZabcdefghigklmnopqrstuvwxyz0123456789=";
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)] ?? "A").join("");
}
