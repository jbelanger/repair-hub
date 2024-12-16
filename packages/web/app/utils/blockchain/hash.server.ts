import { createHash } from 'crypto';
import { type HexString, toHexString } from './types';

export function hashToHexSync(value: string): HexString {
  const hash = createHash('sha256').update(value).digest('hex');
  return toHexString(hash);
}
