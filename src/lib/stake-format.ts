import type { StakeInfo } from './staking';

export type StakeStatus = 'never' | 'locked' | 'unlockable';

const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function deriveStakeStatus(info: StakeInfo | null | undefined): StakeStatus {
  if (!info || !info.startTime || !info.owner || info.owner === '0x0000000000000000000000000000000000000000') {
    return 'never';
  }
  const now = Math.floor(Date.now() / 1000);
  return info.unlockTime > now ? 'locked' : 'unlockable';
}

export function formatTimestamp(value?: number | null): string {
  if (!value) return '—';
  const date = new Date(value * 1000);
  return date.toUTCString();
}

export function formatCountdown(unlockTime?: number | null): string {
  if (!unlockTime) return '—';
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.floor(unlockTime - now);
  if (diff <= 0) return 'Ready to unstake';
  return humanizeDuration(diff);
}

function humanizeDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const parts: string[] = [];

  const days = Math.floor(seconds / DAY);
  if (days) {
    parts.push(`${days}d`);
    seconds -= days * DAY;
  }

  const hours = Math.floor(seconds / HOUR);
  if (hours) {
    parts.push(`${hours}h`);
    seconds -= hours * HOUR;
  }

  const minutes = Math.floor(seconds / MINUTE);
  if (minutes && parts.length < 2) {
    parts.push(`${minutes}m`);
    seconds -= minutes * MINUTE;
  }

  if (!parts.length) {
    parts.push(`${seconds}s`);
  }

  return parts.slice(0, 2).join(' ');
}

export function lockLabel(months: number): string {
  const unit = months === 1 ? 'month' : 'months';
  return `${months} ${unit}`;
}
