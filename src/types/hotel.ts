export type ChannelId = 'booking' | 'agoda' | 'makemytrip' | 'airbnb' | 'direct';

export type BookingStatus = 'confirmed' | 'auto_blocked' | 'checked_in' | 'checked_out' | 'cancelled';

export interface RoomUnit {
  id: string;
  propertyId: string;
  name: string;
  unitType: 'cottage' | 'room' | 'suite';
  capacity: number;
  bedConfig: string;
  basePrice: number;
  amenities: string[];
  floorOrArea: string;
  channelMapping: {
    bookingRoomId: string;
    agodaRoomId: string;
    mmtRoomId: string;
    airbnbListingId: string;
  };
  icalExportUrl: string;
  icalImportUrls: {
    booking?: string;
    agoda?: string;
    makemytrip?: string;
    airbnb?: string;
  };
}

export interface Property {
  id: string;
  name: string;
  tagline: string;
  location: string;
  description: string;
  image: string;
  units: RoomUnit[];
}

export interface Reservation {
  id: string;
  propertyId: string;
  unitId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  channel: ChannelId;
  channelReference: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  createdAt: string;
  syncedChannels: {
    channel: ChannelId;
    status: 'synced' | 'pending' | 'failed' | 'not_applicable';
    syncedAt?: string;
    blockedReference?: string;
  }[];
  notes?: string;
}

export interface SyncLogEvent {
  id: string;
  timestamp: string;
  propertyId: string;
  unitId: string;
  unitName: string;
  channel: ChannelId;
  eventType: 'booking_received' | 'auto_block_pushed' | 'cancellation_received' | 'auto_unblock_pushed' | 'conflict_prevented' | 'rate_update_pushed';
  message: string;
  details: string;
  severity: 'info' | 'success' | 'warning' | 'alert';
}

export interface ChannelConfig {
  id: ChannelId;
  name: string;
  brandColor: string;
  badgeBg: string;
  badgeText: string;
  logoLetter: string;
  apiStatus: 'healthy' | 'syncing' | 'degraded';
  lastPingMs: number;
  totalActiveListings: number;
  autoBlockEnabled: boolean;
  twoWaySyncIntervalMin: number;
}
