import React, { useState } from 'react';
import { Property, Reservation, SyncLogEvent, ChannelId } from '../types/hotel';
import { CHANNEL_CONFIGS } from '../data/initialData';
import { ShieldCheck, Zap, AlertTriangle, ArrowRight, Play, CheckCircle2, RotateCcw, Flame } from 'lucide-react';

interface ConflictSimulatorProps {
  properties: Property[];
  onAddReservation: (res: Reservation) => void;
  onAddSyncLogs: (logs: SyncLogEvent[]) => void;
  onSelectTab: (tab: 'calendar' | 'reservations' | 'channels' | 'simulator' | 'ical' | 'rates') => void;
}

interface SimulationStep {
  timeMs: number;
  label: string;
  channel: ChannelId;
  action: string;
  status: 'pending' | 'success' | 'alert';
}

export const ConflictSimulator: React.FC<ConflictSimulatorProps> = ({
  properties,
  onAddReservation,
  onAddSyncLogs,
  onSelectTab,
}) => {
  const [activeScenario, setActiveScenario] = useState<'booking_lock' | 'race_condition' | 'cancellation_unlock' | 'walkin_lock'>('booking_lock');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [simulationLogs, setSimulationLogs] = useState<SimulationStep[]>([]);
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);

  const runSimulation = () => {
    setIsRunning(true);
    setHasCompleted(false);
    setCurrentStepIndex(0);

    let steps: SimulationStep[] = [];

    if (activeScenario === 'booking_lock') {
      steps = [
        {
          timeMs: 0,
          label: 'Incoming Booking Feed',
          channel: 'booking',
          action: 'Booking.com API payload received: Reservation #BCOM-992102 for Cottage 4 · Hibiscus Grove (Guest: David Hassel, Oct 28 - Oct 31).',
          status: 'success',
        },
        {
          timeMs: 14,
          label: 'Atomic Mutex Lock',
          channel: 'direct',
          action: 'ABS-1 Core Memory Lock acquired for unit #p1-c4. State changed to OCCUPIED.',
          status: 'success',
        },
        {
          timeMs: 38,
          label: 'Airbnb 2-Way Lock',
          channel: 'airbnb',
          action: 'Dispatched 0-inventory calendar block to Airbnb Listing ABNB-WP-COT4-987. Status 200 OK.',
          status: 'success',
        },
        {
          timeMs: 62,
          label: 'Agoda YCS Broadcast',
          channel: 'agoda',
          action: 'Dispatched Stop-Sell API command to Agoda Room AGD-WP-COT4-D. Units remaining set to 0.',
          status: 'success',
        },
        {
          timeMs: 85,
          label: 'MakeMyTrip IngoMMT Broadcast',
          channel: 'makemytrip',
          action: 'Dispatched Rate Code Blackout to MakeMyTrip Room MMT-WP-COT4-STD. 3 channels locked.',
          status: 'success',
        },
        {
          timeMs: 98,
          label: 'Zero Double-Booking Guarantee',
          channel: 'direct',
          action: 'All 4 OTA feeds updated in 98ms. No guest on any other platform can book Cottage 4 for these dates.',
          status: 'success',
        },
      ];
    } else if (activeScenario === 'race_condition') {
      steps = [
        {
          timeMs: 0,
          label: 'Packet 1: MakeMyTrip Inquiry',
          channel: 'makemytrip',
          action: 'MakeMyTrip guest clicks "Book Now" for Room 201 · Promenade Balcony King (Oct 29 - Nov 1). Packet arrives at 04:50:00.000.',
          status: 'success',
        },
        {
          timeMs: 12,
          label: 'Packet 1 Lock Established',
          channel: 'makemytrip',
          action: 'ABS-1 atomic transaction registers MakeMyTrip reservation #MMT-RACE-01. Unit #p2-r201 locked.',
          status: 'success',
        },
        {
          timeMs: 19,
          label: 'Packet 2: Colliding Agoda Inquiry',
          channel: 'agoda',
          action: 'Agoda guest clicks "Book Now" for Room 201 for overlapping dates (Oct 30 - Nov 2). Packet arrives at 04:50:00.019 (19ms later).',
          status: 'alert',
        },
        {
          timeMs: 24,
          label: 'Anti-Collision Shield Engaged',
          channel: 'agoda',
          action: 'ABS-1 Double-Booking Guard intercepts Agoda request. Mutex lock test FAILS: Room 201 is occupied.',
          status: 'alert',
        },
        {
          timeMs: 38,
          label: 'Collision Deflected',
          channel: 'agoda',
          action: 'Agoda API returns HTTP 409 (Sold Out). Agoda guest redirected to alternative room (Room 202 · Quiet Library Queen).',
          status: 'success',
        },
        {
          timeMs: 45,
          label: 'Incident Resolved Safely',
          channel: 'direct',
          action: 'Double booking averted! 1 reservation accepted, 0 overbookings created, zero manual front desk panic.',
          status: 'success',
        },
      ];
    } else if (activeScenario === 'cancellation_unlock') {
      steps = [
        {
          timeMs: 0,
          label: 'OTA Cancellation Webhook',
          channel: 'airbnb',
          action: 'Airbnb guest cancels reservation #HM9X2K3LP8 for Cottage 2 · Jasmine Blossom (Oct 16 - Oct 20).',
          status: 'success',
        },
        {
          timeMs: 16,
          label: 'Unit Release in CRS',
          channel: 'direct',
          action: 'ABS-1 clears reservation block. Unit #p1-c2 marked AVAILABLE for Oct 16 - Oct 20.',
          status: 'success',
        },
        {
          timeMs: 44,
          label: 'Booking.com Reopened',
          channel: 'booking',
          action: 'Pushed inventory = 1 room to Booking.com rate codes. Listing immediately visible to shoppers.',
          status: 'success',
        },
        {
          timeMs: 70,
          label: 'Agoda Reopened',
          channel: 'agoda',
          action: 'Sent Open-For-Sale command to Agoda YCS. Unit available in search results.',
          status: 'success',
        },
        {
          timeMs: 92,
          label: 'MakeMyTrip Reopened',
          channel: 'makemytrip',
          action: 'Pushed inventory = 1 room to MakeMyTrip. Cottage 2 fully open on all 4 channels.',
          status: 'success',
        },
      ];
    } else {
      // walkin_lock
      steps = [
        {
          timeMs: 0,
          label: 'Front Desk Walk-In Input',
          channel: 'direct',
          action: 'Receptionist books Room 101 · Courtyard King for Walk-in guest (Oct 27 - Oct 29).',
          status: 'success',
        },
        {
          timeMs: 15,
          label: 'Immediate 4-Way Broadcast',
          channel: 'direct',
          action: 'ABS-1 triggers parallel blackout webhooks across Booking.com, Agoda, MakeMyTrip, and Airbnb.',
          status: 'success',
        },
        {
          timeMs: 55,
          label: 'All Channels Blacked Out',
          channel: 'direct',
          action: 'Room 101 pulled from online sale worldwide before the guest finishes filling in their passport details.',
          status: 'success',
        },
      ];
    }

    setSimulationLogs(steps);

    // Play step by step
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < steps.length) {
        setCurrentStepIndex(current);
      } else {
        clearInterval(interval);
        setIsRunning(false);
        setHasCompleted(true);

        // Commit real reservation if it's the booking lock scenario
        if (activeScenario === 'booking_lock') {
          const newRes: Reservation = {
            id: `res-sim-${Date.now()}`,
            propertyId: 'prop-1',
            unitId: 'p1-c4',
            guestName: 'David Hassel (Simulated)',
            guestEmail: 'dhassel@techinnovations.com',
            guestPhone: '+1 (555) 789-0123',
            channel: 'booking',
            channelReference: 'BCOM-992102',
            checkIn: '2026-10-28',
            checkOut: '2026-10-31',
            nights: 3,
            totalPrice: 495,
            currency: 'USD',
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            notes: 'Generated via Anti-Double Booking Simulator. Proves automated instant close-out across Agoda, MMT, Airbnb.',
            syncedChannels: [
              { channel: 'airbnb', status: 'synced', blockedReference: 'ABNB-BLK-COT4-AUTO' },
              { channel: 'agoda', status: 'synced', blockedReference: 'AGD-BLK-COT4-AUTO' },
              { channel: 'makemytrip', status: 'synced', blockedReference: 'MMT-BLK-COT4-AUTO' },
            ],
          };

          const logEvents: SyncLogEvent[] = [
            {
              id: `log-sim-${Date.now()}-1`,
              timestamp: new Date().toISOString(),
              propertyId: 'prop-1',
              unitId: 'p1-c4',
              unitName: 'Cottage 4 · Hibiscus Grove',
              channel: 'booking',
              eventType: 'booking_received',
              message: 'Simulated Booking.com reservation #BCOM-992102 confirmed',
              details: 'Dates: Oct 28 - Oct 31 (3 nights). Guest: David Hassel.',
              severity: 'info',
            },
            {
              id: `log-sim-${Date.now()}-2`,
              timestamp: new Date().toISOString(),
              propertyId: 'prop-1',
              unitId: 'p1-c4',
              unitName: 'Cottage 4 · Hibiscus Grove',
              channel: 'airbnb',
              eventType: 'auto_block_pushed',
              message: 'Auto-Block successfully pushed to Airbnb (Listing ABNB-WP-COT4-987)',
              details: 'Oct 28 - Oct 31 closed out. Latency: 38ms.',
              severity: 'success',
            },
            {
              id: `log-sim-${Date.now()}-3`,
              timestamp: new Date().toISOString(),
              propertyId: 'prop-1',
              unitId: 'p1-c4',
              unitName: 'Cottage 4 · Hibiscus Grove',
              channel: 'agoda',
              eventType: 'auto_block_pushed',
              message: 'Auto-Block successfully pushed to Agoda (AGD-WP-COT4-D)',
              details: 'Units remaining: 0. Latency: 62ms.',
              severity: 'success',
            },
            {
              id: `log-sim-${Date.now()}-4`,
              timestamp: new Date().toISOString(),
              propertyId: 'prop-1',
              unitId: 'p1-c4',
              unitName: 'Cottage 4 · Hibiscus Grove',
              channel: 'makemytrip',
              eventType: 'auto_block_pushed',
              message: 'Auto-Block successfully pushed to MakeMyTrip (MMT-WP-COT4-STD)',
              details: 'Rate code stop-sell engaged. Latency: 85ms.',
              severity: 'success',
            },
          ];

          onAddReservation(newRes);
          onAddSyncLogs(logEvents);
        }
      }
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Overview Intro */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 w-fit mb-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Real-Time Concurrency & Double-Booking Prevention Lab</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Automated OTA Conflict Prevention Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Small hotels risk dual-guest walk-ins when multiple OTAs sell the same room simultaneously.
              ABS-1 Resort Manager employs an atomic memory lock combined with sub-100ms multi-channel push signals
              to completely eradicate double bookings across Booking.com, Agoda, MakeMyTrip, and Airbnb.
            </p>
          </div>

          <button
            onClick={runSimulation}
            disabled={isRunning}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold text-white transition-all shadow-sm ${
              isRunning
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
            }`}
          >
            {isRunning ? (
              <>
                <Zap className="w-4 h-4 animate-spin text-amber-300" />
                <span>Running Prevention Engine...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Interactive Test</span>
              </>
            )}
          </button>
        </div>

        {/* Scenario Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <button
            onClick={() => {
              setActiveScenario('booking_lock');
              setSimulationLogs([]);
              setHasCompleted(false);
            }}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              activeScenario === 'booking_lock'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="text-xs font-bold text-slate-900">1. Instant Booking Auto-Lock</div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              Booking.com confirmed booking triggers instant 0-room close-outs on Airbnb, Agoda, and MMT.
            </div>
          </button>

          <button
            onClick={() => {
              setActiveScenario('race_condition');
              setSimulationLogs([]);
              setHasCompleted(false);
            }}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              activeScenario === 'race_condition'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span>2. Near-Collision Race Test</span>
              <Flame className="w-3.5 h-3.5 text-red-500" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              MakeMyTrip & Agoda guests hit 'Book' within 19ms. Engine accepts first, blocks second, diverts safely.
            </div>
          </button>

          <button
            onClick={() => {
              setActiveScenario('cancellation_unlock');
              setSimulationLogs([]);
              setHasCompleted(false);
            }}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              activeScenario === 'cancellation_unlock'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="text-xs font-bold text-slate-900">3. OTA Cancellation Re-Open</div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              Airbnb guest cancels. Engine frees unit and instantly broadcasts availability = 1 to the other 3 OTAs.
            </div>
          </button>

          <button
            onClick={() => {
              setActiveScenario('walkin_lock');
              setSimulationLogs([]);
              setHasCompleted(false);
            }}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              activeScenario === 'walkin_lock'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="text-xs font-bold text-slate-900">4. Desk Walk-In Lockout</div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              Receptionist takes cash walk-in. Online OTA channels pulled from sale before receipt finishes printing.
            </div>
          </button>
        </div>
      </div>

      {/* Execution Visualization & Trace */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live Concurrency Trace
            </span>
            <span className="text-xs text-slate-400 font-mono">
              [Resolution: Sub-millisecond Mutex]
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Safe Lock</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Collision Intercepted</span>
            </div>
          </div>
        </div>

        {simulationLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">Ready to test automated collision defenses</p>
            <p className="text-xs text-slate-400 mt-1">
              Select a scenario above and click &quot;Run Interactive Test&quot; to inspect sub-100ms lock propagation.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {simulationLogs.map((step, idx) => {
              const isVisible = idx <= currentStepIndex;
              if (!isVisible) return null;

              const isCurrent = idx === currentStepIndex && isRunning;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border transition-all animate-in fade-in slide-in-from-left-2 duration-200 ${
                    step.status === 'alert'
                      ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                      : 'bg-slate-50/80 border-slate-200 text-slate-800'
                  } ${isCurrent ? 'ring-2 ring-indigo-500' : ''}`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="font-bold text-slate-600">+{step.timeMs}ms</span>
                      <span className="text-slate-400">|</span>
                      <span className="font-semibold text-slate-900">{step.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 uppercase">
                        {CHANNEL_CONFIGS[step.channel]?.badgeText || 'ABS-1 Core'}
                      </span>
                      {step.status === 'alert' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-sans mt-1">
                    {step.action}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {hasCompleted && (
          <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Simulation Verified: </span>
                <span>
                  {activeScenario === 'booking_lock'
                    ? 'Hibiscus Grove successfully protected. New reservation added to calendar.'
                    : activeScenario === 'race_condition'
                    ? 'Concurrent double booking successfully prevented with 0 overbooked guests.'
                    : activeScenario === 'cancellation_unlock'
                    ? 'Inventory successfully restored across Booking, Agoda, and MakeMyTrip.'
                    : 'Front desk booking blackout active across all 4 OTA feeds.'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('calendar')}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              Inspect Calendar Grid ➜
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
