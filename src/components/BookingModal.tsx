import React, { useState, useEffect } from 'react';
import { Property, Reservation, ChannelId, RoomUnit } from '../types/hotel';
import { CHANNEL_CONFIGS } from '../data/initialData';
import { X, ShieldCheck, AlertTriangle, Check, Trash2, Calendar, User, Phone, Mail, DollarSign } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  existingReservation?: Reservation | null;
  initialUnitId?: string;
  initialPropertyId?: string;
  initialStartDate?: string;
  onSaveReservation: (reservation: Reservation) => void;
  onCancelReservation: (reservationId: string) => void;
  allReservations: Reservation[];
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  properties,
  existingReservation,
  initialUnitId,
  initialPropertyId,
  initialStartDate,
  onSaveReservation,
  onCancelReservation,
  allReservations,
}) => {
  if (!isOpen) return null;

  // Selected property & unit
  const [propertyId, setPropertyId] = useState<string>(
    existingReservation?.propertyId || initialPropertyId || properties[0].id
  );

  const activeProperty = properties.find((p) => p.id === propertyId) || properties[0];

  const [unitId, setUnitId] = useState<string>(
    existingReservation?.unitId || initialUnitId || activeProperty.units[0].id
  );

  const selectedUnit = activeProperty.units.find((u) => u.id === unitId) || activeProperty.units[0];

  // Dates
  const todayStr = '2026-10-14';
  const defaultCheckIn = existingReservation?.checkIn || initialStartDate || '2026-10-22';
  
  // Default checkOut is 2 days later
  const calcDefaultCheckOut = (inDate: string) => {
    const d = new Date(inDate);
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };

  const [checkIn, setCheckIn] = useState<string>(defaultCheckIn);
  const [checkOut, setCheckOut] = useState<string>(
    existingReservation?.checkOut || calcDefaultCheckOut(defaultCheckIn)
  );

  // Form details
  const [guestName, setGuestName] = useState<string>(existingReservation?.guestName || '');
  const [guestEmail, setGuestEmail] = useState<string>(existingReservation?.guestEmail || '');
  const [guestPhone, setGuestPhone] = useState<string>(existingReservation?.guestPhone || '');
  const [channel, setChannel] = useState<ChannelId>(existingReservation?.channel || 'direct');
  const [channelReference, setChannelReference] = useState<string>(
    existingReservation?.channelReference || `DIR-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [notes, setNotes] = useState<string>(existingReservation?.notes || '');
  const [status, setStatus] = useState<Reservation['status']>(
    existingReservation?.status || 'confirmed'
  );

  // Calculate nights & price
  const calculateNights = (inD: string, outD: string) => {
    const start = new Date(inD).getTime();
    const end = new Date(outD).getTime();
    const diff = Math.round((end - start) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 1;
  };

  const nights = calculateNights(checkIn, checkOut);
  const defaultTotal = nights * (selectedUnit?.basePrice || 175);
  const [totalPrice, setTotalPrice] = useState<number>(
    existingReservation?.totalPrice || defaultTotal
  );

  // Keep price updated when unit or dates change if not editing
  useEffect(() => {
    if (!existingReservation) {
      setTotalPrice(calculateNights(checkIn, checkOut) * (selectedUnit?.basePrice || 175));
    }
  }, [selectedUnit, checkIn, checkOut, existingReservation]);

  // Real-time double booking / collision detection
  const conflictingReservation = allReservations.find((res) => {
    if (res.status === 'cancelled') return false;
    if (existingReservation && res.id === existingReservation.id) return false;
    if (res.unitId !== unitId) return false;

    // Overlap condition:
    // (StartA < EndB) and (EndA > StartB)
    return checkIn < res.checkOut && checkOut > res.checkIn;
  });

  // Suggest alternative unit if conflict found
  const findAvailableAlternativeUnit = () => {
    for (const prop of properties) {
      for (const u of prop.units) {
        const hasConflict = allReservations.some(
          (r) =>
            r.status !== 'cancelled' &&
            r.unitId === u.id &&
            checkIn < r.checkOut &&
            checkOut > r.checkIn
        );
        if (!hasConflict) {
          setPropertyId(prop.id);
          setUnitId(u.id);
          return;
        }
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflictingReservation) {
      return; // Block save if double booking detected
    }

    const otherChannels: ChannelId[] = (['booking', 'airbnb', 'agoda', 'makemytrip', 'direct'] as ChannelId[]).filter(
      (c) => c !== channel && c !== 'direct'
    );

    const nowIso = new Date().toISOString();

    const reservationToSave: Reservation = {
      id: existingReservation ? existingReservation.id : `res-${Date.now()}`,
      propertyId,
      unitId,
      guestName: guestName.trim() || 'Guest Reservation',
      guestEmail: guestEmail.trim() || 'guest@example.com',
      guestPhone: guestPhone.trim() || '+1 (555) 000-0000',
      channel,
      channelReference: channelReference.trim(),
      checkIn,
      checkOut,
      nights,
      totalPrice: Number(totalPrice),
      currency: 'USD',
      status,
      createdAt: existingReservation ? existingReservation.createdAt : nowIso,
      notes,
      syncedChannels: otherChannels.map((ch) => ({
        channel: ch,
        status: 'synced',
        syncedAt: nowIso,
        blockedReference: `AUTO-BLK-${ch.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      })),
    };

    onSaveReservation(reservationToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {existingReservation ? 'Reservation Details & Sync Status' : 'Create New Reservation / Direct Block'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated 2-way synchronization will instantly update all 4 OTAs.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Double Booking Warning Banner if collision detected */}
        {conflictingReservation && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3.5 flex items-start justify-between gap-3 text-xs text-red-900">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Collision Detected (Double Booking Prevented): </span>
                <span>
                  {selectedUnit.name} is already booked by{' '}
                  <strong>{conflictingReservation.guestName}</strong> ({conflictingReservation.checkIn} to{' '}
                  {conflictingReservation.checkOut}) via{' '}
                  <strong>{CHANNEL_CONFIGS[conflictingReservation.channel].badgeText}</strong>.
                </span>
                <p className="mt-1 text-red-800">
                  ABS-1 Resort Manager prevents saving to protect your property from dual guest arrivals.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={findAvailableAlternativeUnit}
              className="px-2.5 py-1 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 rounded shadow-xs whitespace-nowrap shrink-0 transition-colors"
            >
              Auto-Pick Free Unit
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Property Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Property</label>
              <select
                value={propertyId}
                onChange={(e) => {
                  const newPropId = e.target.value;
                  setPropertyId(newPropId);
                  const p = properties.find((item) => item.id === newPropId);
                  if (p && p.units.length > 0) {
                    setUnitId(p.units[0].id);
                  }
                }}
                disabled={!!existingReservation}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id === 'prop-1' ? '5 Cottages + 1 Suite' : '6 Boutique Rooms'})
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Room / Cottage Unit
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                disabled={!!existingReservation}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {activeProperty.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — ${u.basePrice}/night ({u.bedConfig})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates & Nights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Check-In Date</label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Check-Out Date</label>
              <input
                type="date"
                required
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration & Price</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium py-2">
                  {nights} {nights === 1 ? 'night' : 'nights'}
                </span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-2 text-xs text-slate-500">$</span>
                  <input
                    type="number"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-slate-300 pl-6 pr-3 py-2 font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Channel & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Channel Source</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as ChannelId)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="direct">Direct Desk / Phone / Walk-In</option>
                <option value="booking">Booking.com</option>
                <option value="airbnb">Airbnb</option>
                <option value="agoda">Agoda.com</option>
                <option value="makemytrip">MakeMyTrip.com</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Booking Reference #
              </label>
              <input
                type="text"
                value={channelReference}
                onChange={(e) => setChannelReference(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Guest Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Guest Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="guest@domain.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                placeholder="+1 (555) 234-5678"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Reservation Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Stay Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Reservation['status'])}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="checked_out">Checked Out</option>
                <option value="cancelled">Cancelled (Reopens Inventory)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Special Notes / Requests</label>
              <input
                type="text"
                placeholder="e.g. Quiet room requested, anniversary couple, late check-in"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Automated Multi-Channel Lock Breakdown */}
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Automated Double-Booking Prevention Action:</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Upon confirming, ABS-1 Resort Manager immediately dispatches 0-inventory stop-sell commands to all
              unselected channels for {checkIn} to {checkOut}:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {(['booking', 'airbnb', 'agoda', 'makemytrip'] as ChannelId[]).map((ch) => {
                const isSource = ch === channel;
                return (
                  <div
                    key={ch}
                    className={`p-2 rounded text-xs border ${
                      isSource
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      {CHANNEL_CONFIGS[ch].badgeText}
                    </div>
                    <div className="text-[11px] mt-0.5">
                      {isSource ? 'Source Booking' : 'Auto-Blocked (0 Keys)'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Existing Synced Channels Details (if editing) */}
          {existingReservation && existingReservation.syncedChannels && (
            <div className="border-t border-slate-200 pt-3">
              <span className="text-xs font-medium text-slate-600">Active OTA Synced Locks:</span>
              <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
                {existingReservation.syncedChannels.map((sc) => (
                  <span
                    key={sc.channel}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono text-[10px]"
                  >
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>{CHANNEL_CONFIGS[sc.channel].badgeText}: {sc.blockedReference}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            {existingReservation ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Cancel this reservation? This will immediately reopen the dates on all 4 OTAs.')) {
                    onCancelReservation(existingReservation.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Cancel Reservation</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!!conflictingReservation}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm ${
                  conflictingReservation
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{existingReservation ? 'Save Changes' : 'Confirm & Push Sync'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
