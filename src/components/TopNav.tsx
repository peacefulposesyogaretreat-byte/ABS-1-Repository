import React from 'react';
import { Calendar, ShieldCheck, RefreshCw, Layers, DollarSign, ListFilter, Plus, Bell } from 'lucide-react';

interface TopNavProps {
  activeTab: 'calendar' | 'reservations' | 'channels' | 'simulator' | 'ical' | 'rates';
  setActiveTab: (tab: 'calendar' | 'reservations' | 'channels' | 'simulator' | 'ical' | 'rates') => void;
  onNewReservation: () => void;
  onOpenLogs: () => void;
  logCount: number;
  isSyncing: boolean;
  onSyncAll: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onNewReservation,
  onOpenLogs,
  logCount,
  isSyncing,
  onSyncAll,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
              ABS
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                ABS-1 Resort Manager
              </span>
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                2 Hotels · 12 Units · 4 Channels
              </span>
            </div>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium text-slate-600 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'calendar'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-slate-600" />
              Calendar Grid
            </button>

            <button
              onClick={() => setActiveTab('reservations')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'reservations'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ListFilter className="w-4 h-4 text-slate-600" />
              Bookings
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'simulator'
                  ? 'bg-amber-50 text-amber-900 font-semibold border border-amber-200'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Anti-Double Booking Simulator
            </button>

            <button
              onClick={() => setActiveTab('channels')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'channels'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-slate-600" />
              Channel Manager
            </button>

            <button
              onClick={() => setActiveTab('ical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'ical'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4 text-slate-600" />
              iCal Feeds
            </button>

            <button
              onClick={() => setActiveTab('rates')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'rates'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <DollarSign className="w-4 h-4 text-slate-600" />
              Rates & Stop-Sell
            </button>
          </nav>

          {/* Zone 3: 1 primary action + Sync tools */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onSyncAll}
              disabled={isSyncing}
              title="Push atomic sync across Booking.com, Agoda, MakeMyTrip & Airbnb"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : 'text-slate-600'}`} />
              <span>{isSyncing ? 'Syncing OTAs...' : 'Sync All 4 OTAs'}</span>
            </button>

            <button
              onClick={onOpenLogs}
              title="View live channel sync audit trail"
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Bell className="w-4 h-4" />
              {logCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              onClick={onNewReservation}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Reservation</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
