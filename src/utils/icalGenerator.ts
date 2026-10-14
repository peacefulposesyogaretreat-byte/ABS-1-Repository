import { Reservation, RoomUnit } from '../types/hotel';

/**
 * Generates an RFC 5545 compliant iCalendar string for a given room and its active reservations.
 * Standard format recognized by Booking.com, Airbnb, Agoda, and MakeMyTrip calendar sync.
 */
export function generateICalFeed(unit: RoomUnit, reservations: Reservation[]): string {
  const activeReservations = reservations.filter(
    (r) => r.unitId === unit.id && r.status !== 'cancelled'
  );

  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ABS-1 Resort Manager//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${unit.name} Availability`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const res of activeReservations) {
    const startStr = res.checkIn.replace(/-/g, '');
    const endStr = res.checkOut.replace(/-/g, '');
    const uid = `${res.id}-${res.unitId}@abs1manager.app`;
    const summary =
      res.channel === 'direct'
        ? 'Reserved (Direct Desk)'
        : `Reserved (${res.channel.toUpperCase()} - ${res.guestName.split(' ')[0]})`;

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${uid}`);
    ics.push(`DTSTAMP:${now}`);
    ics.push(`DTSTART;VALUE=DATE:${startStr}`);
    ics.push(`DTEND;VALUE=DATE:${endStr}`);
    ics.push(`SUMMARY:${summary}`);
    ics.push(`DESCRIPTION:ABS-1 Resort Manager Auto-Block Protection | Unit: ${unit.name} | Ref: ${res.channelReference}`);
    ics.push('STATUS:CONFIRMED');
    ics.push('TRANSP:OPAQUE');
    ics.push('END:VEVENT');
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

/**
 * Triggers a browser download of the generated .ics file
 */
export function downloadICalFile(unit: RoomUnit, reservations: Reservation[]) {
  const content = generateICalFeed(unit, reservations);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${unit.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_calendar.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses raw iCal string to extract simulated events
 */
export function parseICalText(rawText: string): Array<{
  summary: string;
  dtstart: string;
  dtend: string;
  uid: string;
}> {
  const events: Array<{ summary: string; dtstart: string; dtend: string; uid: string }> = [];
  const lines = rawText.split(/\r\n|\n|\r/);

  let inEvent = false;
  let currentEvent: { summary?: string; dtstart?: string; dtend?: string; uid?: string } = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (trimmed === 'END:VEVENT') {
      if (inEvent && currentEvent.dtstart && currentEvent.dtend) {
        events.push({
          summary: currentEvent.summary || 'Reserved External Unit',
          dtstart: currentEvent.dtstart,
          dtend: currentEvent.dtend,
          uid: currentEvent.uid || `ext-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        });
      }
      inEvent = false;
    } else if (inEvent) {
      if (trimmed.startsWith('SUMMARY:')) {
        currentEvent.summary = trimmed.substring(8);
      } else if (trimmed.startsWith('DTSTART')) {
        const val = trimmed.split(':')[1];
        if (val && val.length >= 8) {
          // format YYYYMMDD to YYYY-MM-DD
          currentEvent.dtstart = `${val.substring(0, 4)}-${val.substring(4, 6)}-${val.substring(6, 8)}`;
        }
      } else if (trimmed.startsWith('DTEND')) {
        const val = trimmed.split(':')[1];
        if (val && val.length >= 8) {
          currentEvent.dtend = `${val.substring(0, 4)}-${val.substring(4, 6)}-${val.substring(6, 8)}`;
        }
      } else if (trimmed.startsWith('UID:')) {
        currentEvent.uid = trimmed.substring(4);
      }
    }
  }

  return events;
}
