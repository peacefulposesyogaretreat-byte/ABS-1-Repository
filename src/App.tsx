import React, { useState, useEffect } from 'react';
import { Property, Reservation, SyncLogEvent, ChannelId, RoomUnit } from './types/hotel';
import { INITIAL_PROPERTIES, INITIAL_RESERVATIONS, INITIAL_SYNC_LOGS, CHANNEL_CONFIGS } from './data/initialData';
import { TopNav } from './components/TopNav';
import { PropertyHeader } from './components/PropertyHeader';
import { TapeChartCalendar } from './components/TapeChartCalendar';
import { BookingModal } from './components/BookingModal';
import { ReservationList } from './components/ReservationList';
import { ChannelSyncManager } from './components/ChannelSyncManager';
import { ConflictSimulator } from './components/ConflictSimulator';
import { ICalFeedsManager } from './components/ICalFeedsManager';
import { RatesAvailabilityManager } from './components/RatesAvailabilityManager';
import { SyncLogDrawer } from './components/SyncLogDrawer';
import { ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';

export default function App() {
  // Load state from localStorage or use initial seed
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('omnisync_properties');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse properties from localStorage', e);
      }
    }
    return INITIAL_PROPERTIES;
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('omnisync_reservations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse reservations from localStorage', e);
      }
    }
    return INITIAL_RESERVATIONS;
  });

  const [syncLogs, setSyncLogs] = useState<SyncLogEvent[]>(() => {
    const saved = localStorage.getItem('omnisync_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse logs from localStorage', e);
      }
    }
    return INITIAL_SYNC_LOGS;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'calendar' | 'reservations' | 'channels' | 'simulator' | 'ical' | 'rates'>('calendar');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [modalInitialUnitId, setModalInitialUnitId] = useState<string | undefined>();
  const [modalInitialPropId, setModalInitialPropId] = useState<string | undefined>();
  const [modalInitialStartDate, setModalInitialStartDate] = useState<string | undefined>();
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('omnisync_properties', JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem('omnisync_reservations', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('omnisync_logs', JSON.stringify(syncLogs));
  }, [syncLogs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Helper to find unit name
  const getUnitName = (unitId: string) => {
    for (const p of properties) {
      const u = p.units.find((item) => item.id === unitId);
      if (u) return u.name;
    }
    return 'Room / Cottage';
  };

  // Trigger sync all 4 OTAs
  const handleSyncAll = (specificChannel?: ChannelId) => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date().toISOString();
      const channelsToSync = specificChannel
        ? [specificChannel]
        : (['booking', 'airbnb', 'agoda', 'makemytrip'] as ChannelId[]);

      const newLogs: SyncLogEvent[] = channelsToSync.map((ch) => ({
        id: `log-sync-${Date.now()}-${ch}`,
        timestamp: now,
        propertyId: 'all',
        unitId: 'all',
        unitName: 'All 12 Units',
        channel: ch,
        eventType: 'auto_block_pushed',
        message: `Parity verification complete on ${CHANNEL_CONFIGS[ch].name}`,
        details: `Synced availability & blackout dates for 12 keys. 0 conflicts found. Latency: ${CHANNEL_CONFIGS[ch].lastPingMs}ms.`,
        severity: 'success',
      }));

      setSyncLogs((prev) => [newLogs[0], ...prev]);
      showToast(
        specificChannel
          ? `Synced feed with ${CHANNEL_CONFIGS[specificChannel].name} successfully.`
          : 'All 4 OTAs synchronized: 12 units locked in parity. 0 overbooking risk.'
      );
    }, 800);
  };

  // Save or create a reservation (automatically dispatches auto-blocks to other 3 OTAs)
  const handleSaveReservation = (res: Reservation) => {
    const isEdit = reservations.some((r) => r.id === res.id);
    const unitName = getUnitName(res.unitId);
    const otherChannels: ChannelId[] = (['booking', 'airbnb', 'agoda', 'makemytrip'] as ChannelId[]).filter(
      (c) => c !== res.channel
    );

    const now = new Date().toISOString();
    const newLogs: SyncLogEvent[] = [
      {
        id: `log-${Date.now()}-src`,
        timestamp: now,
        propertyId: res.propertyId,
        unitId: res.unitId,
        unitName,
        channel: res.channel,
        eventType: 'booking_received',
        message: `${isEdit ? 'Updated' : 'New'} reservation #${res.channelReference} (${res.guestName})`,
        details: `${res.checkIn} to ${res.checkOut} (${res.nights} nights). Source: ${CHANNEL_CONFIGS[res.channel].badgeText}. Total: $${res.totalPrice}.`,
        severity: 'info',
      },
      ...otherChannels.map((ch) => ({
        id: `log-${Date.now()}-${ch}`,
        timestamp: now,
        propertyId: res.propertyId,
        unitId: res.unitId,
        unitName,
        channel: ch,
        eventType: 'auto_block_pushed' as const,
        message: `⚡ Auto-Blocked ${unitName} on ${CHANNEL_CONFIGS[ch].badgeText}`,
        details: `Zero rooms available pushed for dates ${res.checkIn} to ${res.checkOut}. Double booking prevented.`,
        severity: 'success' as const,
      })),
    ];

    if (isEdit) {
      setReservations((prev) => prev.map((r) => (r.id === res.id ? res : r)));
    } else {
      setReservations((prev) => [res, ...prev]);
    }

    setSyncLogs((prev) => [...newLogs, ...prev]);
    showToast(`Reservation confirmed. Automated lock broadcast to other 3 OTAs.`);
  };

  // Cancel reservation (immediately unlocks the dates on other 3 channels!)
  const handleCancelReservation = (reservationId: string) => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) return;

    const unitName = getUnitName(target.unitId);
    const otherChannels: ChannelId[] = ['booking', 'airbnb', 'agoda', 'makemytrip'];
    const now = new Date().toISOString();

    const unlockLogs: SyncLogEvent[] = [
      {
        id: `log-${Date.now()}-canc`,
        timestamp: now,
        propertyId: target.propertyId,
        unitId: target.unitId,
        unitName,
        channel: target.channel,
        eventType: 'cancellation_received',
        message: `Cancelled reservation #${target.channelReference} (${target.guestName})`,
        details: `Dates ${target.checkIn} to ${target.checkOut} freed in CRS.`,
        severity: 'info',
      },
      ...otherChannels.map((ch) => ({
        id: `log-${Date.now()}-unblk-${ch}`,
        timestamp: now,
        propertyId: target.propertyId,
        unitId: target.unitId,
        unitName,
        channel: ch,
        eventType: 'auto_unblock_pushed' as const,
        message: `Auto-Unblocked ${unitName} on ${CHANNEL_CONFIGS[ch].badgeText}`,
        details: `Reopened 1 room for dates ${target.checkIn} to ${target.checkOut}. Available for online booking.`,
        severity: 'success' as const,
      })),
    ];

    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: 'cancelled' } : r))
    );
    setSyncLogs((prev) => [...unlockLogs, ...prev]);
    showToast(`Reservation cancelled. ${unitName} automatically reopened across all 4 OTAs.`);
  };

  // Change status (checked-in / checked-out)
  const handleStatusChange = (id: string, status: Reservation['status']) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    showToast(`Reservation status updated to: ${status.replace('_', ' ')}`);
  };

  // Update room mapping IDs
  const handleUpdateUnitMapping = (propertyId: string, unitId: string, mapping: RoomUnit['channelMapping']) => {
    setProperties((prev) =>
      prev.map((p) => {
        if (p.id !== propertyId) return p;
        return {
          ...p,
          units: p.units.map((u) => (u.id === unitId ? { ...u, channelMapping: mapping } : u)),
        };
      })
    );
    showToast(`Channel room ID mappings updated successfully.`);
  };

  // Update unit base price
  const handleUpdateUnitRate = (propertyId: string, unitId: string, newPrice: number) => {
    setProperties((prev) =>
      prev.map((p) => {
        if (p.id !== propertyId) return p;
        return {
          ...p,
          units: p.units.map((u) => (u.id === unitId ? { ...u, basePrice: newPrice } : u)),
        };
      })
    );
  };

  // Bulk stop sell
  const handleBulkStopSell = (unitId: string, isClosed: boolean) => {
    const unitName = getUnitName(unitId);
    showToast(isClosed ? `Stop-Sell active: ${unitName} closed on all 4 OTAs.` : `Stop-Sell removed: ${unitName} open on all OTAs.`);
  };

  // Import external iCal events
  const handleImportICalEvents = (
    unitId: string,
    events: Array<{ summary: string; dtstart: string; dtend: string; uid: string }>
  ) => {
    let propId = properties[0].id;
    for (const p of properties) {
      if (p.units.some((u) => u.id === unitId)) {
        propId = p.id;
        break;
      }
    }

    const newResList: Reservation[] = events.map((ev, idx) => ({
      id: `res-ical-${Date.now()}-${idx}`,
      propertyId: propId,
      unitId,
      guestName: ev.summary || 'Imported OTA Guest',
      guestEmail: 'imported@ota-feed.com',
      guestPhone: 'Via iCal Sync',
      channel: 'agoda',
      channelReference: ev.uid || `EXT-${Date.now()}`,
      checkIn: ev.dtstart,
      checkOut: ev.dtend,
      nights: 3,
      totalPrice: 500,
      currency: 'USD',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      notes: 'Imported via External OTA iCalendar feed.',
      syncedChannels: [
        { channel: 'booking', status: 'synced', blockedReference: 'BCOM-AUTO-BLK' },
        { channel: 'airbnb', status: 'synced', blockedReference: 'ABNB-AUTO-BLK' },
        { channel: 'makemytrip', status: 'synced', blockedReference: 'MMT-AUTO-BLK' },
      ],
    }));

    setReservations((prev) => [...newResList, ...prev]);
    showToast(`Successfully imported ${events.length} external reservation(s) into calendar.`);
  };

  // Open booking modal
  const handleOpenNewReservation = (unitId?: string, propId?: string, startDate?: string) => {
    setSelectedReservation(null);
    setModalInitialUnitId(unitId);
    setModalInitialPropId(propId);
    setModalInitialStartDate(startDate);
    setIsBookingModalOpen(true);
  };

  const handleSelectReservation = (res: Reservation) => {
    setSelectedReservation(res);
    setModalInitialUnitId(res.unitId);
    setModalInitialPropId(res.propertyId);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewReservation={() => handleOpenNewReservation()}
        onOpenLogs={() => setIsLogDrawerOpen(true)}
        logCount={syncLogs.length}
        isSyncing={isSyncing}
        onSyncAll={() => handleSyncAll()}
      />

      {/* Property & Portfolio Header */}
      <PropertyHeader
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        onSelectProperty={setSelectedPropertyId}
        reservations={reservations}
        onSyncAll={() => handleSyncAll()}
        isSyncing={isSyncing}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Multi-Hotel Central Reservation Tape Chart
                </h2>
                <p className="text-xs text-slate-500">
                  Visual calendar across all 12 units. Confirmed bookings automatically block other 3 OTAs.
                </p>
              </div>
              <button
                onClick={() => handleOpenNewReservation()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                + Direct / Walk-In Block
              </button>
            </div>

            <TapeChartCalendar
              properties={properties}
              selectedPropertyId={selectedPropertyId}
              reservations={reservations}
              onSelectReservation={handleSelectReservation}
              onCreateReservation={(unitId, propId, startDate) =>
                handleOpenNewReservation(unitId, propId, startDate)
              }
            />
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Master Bookings Ledger</h2>
              <p className="text-xs text-slate-500">
                All reservations across Booking.com, Airbnb, Agoda, MakeMyTrip, and Direct desk.
              </p>
            </div>

            <ReservationList
              properties={properties}
              reservations={reservations}
              onSelectReservation={handleSelectReservation}
              onNewReservation={() => handleOpenNewReservation()}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}

        {activeTab === 'simulator' && (
          <ConflictSimulator
            properties={properties}
            onAddReservation={(newRes) => {
              setReservations((prev) => [newRes, ...prev]);
              showToast(`Simulated reservation added. Auto-blocks pushed to Agoda, MMT, Airbnb.`);
            }}
            onAddSyncLogs={(newLogs) => {
              setSyncLogs((prev) => [...newLogs, ...prev]);
            }}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'channels' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                OTA Channel Manager & Mapping
              </h2>
              <p className="text-xs text-slate-500">
                Manage live connectivity, room mappings, and auto-stop rules for Booking.com, Agoda, MakeMyTrip, and Airbnb.
              </p>
            </div>

            <ChannelSyncManager
              properties={properties}
              onTriggerSync={handleSyncAll}
              isSyncing={isSyncing}
              onUpdateUnitMapping={handleUpdateUnitMapping}
            />
          </div>
        )}

        {activeTab === 'ical' && (
          <ICalFeedsManager
            properties={properties}
            reservations={reservations}
            onImportEvents={handleImportICalEvents}
          />
        )}

        {activeTab === 'rates' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Channel Rate Parity & Stop-Sell Console
              </h2>
              <p className="text-xs text-slate-500">
                Set base rack rates, configure markups per OTA, and trigger 1-click emergency stop-sells.
              </p>
            </div>

            <RatesAvailabilityManager
              properties={properties}
              onUpdateUnitRate={handleUpdateUnitRate}
              onBulkStopSell={handleBulkStopSell}
              onSyncPush={(msg) => {
                showToast(msg);
                setSyncLogs((prev) => [
                  {
                    id: `log-${Date.now()}-rate`,
                    timestamp: new Date().toISOString(),
                    propertyId: 'all',
                    unitId: 'all',
                    unitName: 'All Channels',
                    channel: 'direct',
                    eventType: 'rate_update_pushed',
                    message: msg,
                    details: 'Pushed across Booking.com, Agoda, MakeMyTrip, and Airbnb.',
                    severity: 'info',
                  },
                  ...prev,
                ]);
              }}
            />
          </div>
        )}
      </main>

      {/* Booking / Details Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        properties={properties}
        existingReservation={selectedReservation}
        initialUnitId={modalInitialUnitId}
        initialPropertyId={modalInitialPropId}
        initialStartDate={modalInitialStartDate}
        onSaveReservation={handleSaveReservation}
        onCancelReservation={handleCancelReservation}
        allReservations={reservations}
      />

      {/* Sync Log Drawer */}
      <SyncLogDrawer
        isOpen={isLogDrawerOpen}
        onClose={() => setIsLogDrawerOpen(false)}
        logs={syncLogs}
        onClearLogs={() => setSyncLogs([])}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-800 flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
