export type HexString = `0x${string}`;

export function toHexString(value: string): HexString {
  return value.startsWith('0x') ? value as HexString : `0x${value}` as HexString;
}

export async function hashToHex(value: string): Promise<HexString> {
  // Use Web Crypto API for browser-safe hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return toHexString(hashHex);
}

// Common blockchain types
export type Address = HexString;
export type TransactionHash = HexString;
export type BlockHash = HexString;

// Convert an Ethereum address to checksum format
export function toChecksumAddress(address: string): Address {
  if (!address.startsWith('0x')) {
    address = `0x${address}`;
  }
  return address.toLowerCase() as Address;
}

// Get Etherscan link for address, transaction, or token
export function getEtherscanLink(type: 'tx' | 'address' | 'token', value: string): string | undefined {
  // Only create link if value is a valid hex string starting with 0x
  if (!/^0x[a-fA-F0-9]+$/.test(value)) {
    return undefined;
  }
  return `https://sepolia.etherscan.io/${type}/${value}`;
}
