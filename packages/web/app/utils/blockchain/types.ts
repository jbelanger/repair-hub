import { createHash } from 'crypto';

export type HexString = `0x${string}`;

export function toHexString(value: string): HexString {
  return value.startsWith('0x') ? value as HexString : `0x${value}` as HexString;
}

export function hashToHex(value: string): HexString {
  const hash = createHash('sha256').update(value).digest('hex');
  return toHexString(hash);
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
