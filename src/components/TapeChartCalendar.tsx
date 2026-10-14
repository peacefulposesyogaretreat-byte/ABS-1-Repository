import React, { useState } from 'react';
import { Property, Reservation, RoomUnit, ChannelId } from '../types/hotel';
import { CHANNEL_CONFIGS } from '../data/initialData';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ShieldCheck, Lock, Plus, Info } from 'lucide-react';

interface TapeChartCalendarProps {
  properties: Property[];
  selectedPropertyId: string;
  reservations: Reservation[];
  onSelectReservation: (reservation: Reservation) => void;
  onCreateReservation: (unitId: string, propertyId: string, startDate?: string) => void;
}

export const TapeChartCalendar: React.FC<TapeChartCalendarProps> = ({
  properties,
  selectedPropertyId,
  reservations,
  onSelectReservation,
  onCreateReservation,
}) => {
  // Base date starts on Oct 14, 2026 (matching our simulated current date)
  const [startDateStr, setStartDateStr] = useState<string>('2026-10-14');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');

  const startDate = new Date(startDateStr);
  const daysToShow = 14;

  // Generate date array
  const dateList: Date[] = [];
  for (let i = 0; i < daysToShow; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dateList.push(d);
  }

  const handlePrevDays = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - 7);
    setStartDateStr(d.toISOString().split('T')[0]);
  };

  const handleNextDays = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 7);
    setStartDateStr(d.toISOString().split('T')[0]);
  };

  const handleResetToday = () => {
    setStartDateStr('2026-10-14');
  };

  // Filter properties & units
  const filteredProperties = properties.filter((p) =>
    selectedPropertyId === 'all' ? true : p.id === selectedPropertyId
  );

  const formatDateHeader = (d: Date) => {
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const isToday = d.toISOString().split('T')[0] === '2026-10-14';
    return { dayName, dayNum, month, isToday, iso: d.toISOString().split('T')[0] };
  };

  const getReservationForUnitAndDate = (unitId: string, dateIso: string) => {
    return reservations.find((res) => {
      if (res.status === 'cancelled') return false;
      if (res.unitId !== unitId) return false;
      if (selectedChannelFilter !== 'all' && res.channel !== selectedChannelFilter) return false;
      // Res checkIn is inclusive, checkOut is day of departure (room becomes free at noon)
      return dateIso >= res.checkIn && dateIso < res.checkOut;
    });
  };

  const getChannelColorClasses = (channel: ChannelId) => {
    switch (channel) {
      case 'booking':
        return 'bg-blue-600 text-white hover:bg-blue-700 border-blue-700';
      case 'airbnb':
        return 'bg-rose-500 text-white hover:bg-rose-600 border-rose-600';
      case 'agoda':
        return 'bg-teal-600 text-white hover:bg-teal-700 border-teal-700';
      case 'makemytrip':
        return 'bg-red-600 text-white hover:bg-red-700 border-red-700';
      case 'direct':
      default:
        return 'bg-slate-700 text-white hover:bg-slate-800 border-slate-800';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Calendar Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={handlePrevDays}
              className="p-1.5 hover:bg-white rounded text-slate-700 transition-colors"
              title="Previous 7 Days"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-white rounded transition-colors whitespace-nowrap"
            >
              Today (Oct 14)
            </button>
            <button
              onClick={handleNextDays}
              className="p-1.5 hover:bg-white rounded text-slate-700 transition-colors"
              title="Next 7 Days"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {dateList[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' — '}
              {dateList[dateList.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Channel Filter & Legend */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1">Filter Source:</span>
          <button
            onClick={() => setSelectedChannelFilter('all')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              selectedChannelFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Channels
          </button>
          {(['booking', 'airbnb', 'agoda', 'makemytrip', 'direct'] as ChannelId[]).map((ch) => (
            <button
              key={ch}
              onClick={() => setSelectedChannelFilter(ch)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors whitespace-nowrap ${
                selectedChannelFilter === ch
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {CHANNEL_CONFIGS[ch].badgeText}
            </button>
          ))}
        </div>
      </div>

      {/* Synchronized tape chart grid */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[1020px]">
          {/* Header Row: Dates */}
          <div className="grid grid-cols-[260px_repeat(14,minmax(54px,1fr))] bg-slate-50 border-b border-slate-200 text-slate-700 font-medium text-xs sticky top-0 z-10">
            <div className="p-3 border-r border-slate-200 flex items-center justify-between font-semibold text-slate-900 bg-slate-100/70">
              <span>Rooms & Cottages</span>
              <span className="text-[10px] text-slate-500 font-normal">Base Rate</span>
            </div>

            {dateList.map((d) => {
              const info = formatDateHeader(d);
              return (
                <div
                  key={info.iso}
                  className={`py-2 px-1 text-center border-r border-slate-200 flex flex-col justify-center ${
                    info.isToday ? 'bg-indigo-50/80 font-bold text-indigo-950' : ''
                  }`}
                >
                  <span className="text-[10px] text-slate-500 uppercase">{info.dayName}</span>
                  <span className={`text-sm tabular-nums ${info.isToday ? 'text-indigo-600 font-bold' : 'text-slate-800'}`}>
                    {info.dayNum}
                  </span>
                  <span className="text-[9px] text-slate-500">{info.month}</span>
                </div>
              );
            })}
          </div>

          {/* Properties & Units */}
          {filteredProperties.map((prop) => (
            <div key={prop.id} className="border-b border-slate-300">
              {/* Property Subheader Banner */}
              <div className="bg-slate-100/90 px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-900 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span>{prop.name}</span>
                  <span className="text-[11px] font-normal text-slate-500">({prop.units.length} units total)</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-normal">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2-way 0-delay sync active across 4 OTAs</span>
                </div>
              </div>

              {/* Unit Rows */}
              {prop.units.map((unit) => (
                <div
                  key={unit.id}
                  className="grid grid-cols-[260px_repeat(14,minmax(54px,1fr))] border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-xs relative group"
                >
                  {/* Left Column: Unit Meta */}
                  <div className="p-3 border-r border-slate-200 flex flex-col justify-center bg-white group-hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-slate-900 truncate" title={unit.name}>
                        {unit.name}
                      </span>
                      <span className="text-[11px] text-slate-600 font-mono tabular-nums shrink-0">
                        ${unit.basePrice}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {unit.bedConfig}
                    </div>
                  </div>

                  {/* 14 Days Cells */}
                  {dateList.map((d) => {
                    const dateIso = d.toISOString().split('T')[0];
                    const reservation = getReservationForUnitAndDate(unit.id, dateIso);
                    const isStartOfBooking = reservation && reservation.checkIn === dateIso;
                    const isToday = dateIso === '2026-10-14';

                    if (reservation) {
                      return (
                        <div
                          key={dateIso}
                          onClick={() => onSelectReservation(reservation)}
                          className={`p-1 border-r border-slate-200 flex items-center justify-center cursor-pointer transition-transform relative ${
                            isToday ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          <div
                            className={`w-full h-8 rounded px-1.5 flex items-center gap-1 text-[11px] font-medium shadow-xs border truncate ${getChannelColorClasses(
                              reservation.channel
                            )}`}
                            title={`Guest: ${reservation.guestName} (${CHANNEL_CONFIGS[reservation.channel].badgeText})\nDates: ${reservation.checkIn} to ${reservation.checkOut}\nTotal: $${reservation.totalPrice}\n\n⚡ Automated Inventory Blocked on remaining 3 OTAs.`}
                          >
                            <span className="font-bold uppercase text-[9px] px-1 py-0.2 bg-black/20 rounded shrink-0">
                              {CHANNEL_CONFIGS[reservation.channel].logoLetter}
                            </span>
                            {isStartOfBooking && (
                              <span className="truncate font-semibold">{reservation.guestName.split(' ')[0]}</span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Empty available slot
                    return (
                      <div
                        key={dateIso}
                        onClick={() => onCreateReservation(unit.id, prop.id, dateIso)}
                        className={`p-1 border-r border-slate-100 flex items-center justify-center cursor-pointer group/cell hover:bg-indigo-50/50 transition-colors relative ${
                          isToday ? 'bg-indigo-50/20' : ''
                        }`}
                        title={`Available on Booking.com, Airbnb, Agoda, MakeMyTrip\nClick to create direct reservation or block dates.`}
                      >
                        <span className="opacity-0 group-hover/cell:opacity-100 text-indigo-600 transition-opacity flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend & Explanation Bar */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-medium text-slate-700">Channel Key:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600" />
            <span>Booking.com</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500" />
            <span>Airbnb</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-teal-600" />
            <span>Agoda</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-600" />
            <span>MakeMyTrip</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-700" />
            <span>Direct / Desk</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Every confirmed reservation instantly locks inventory on the other 3 channels</span>
        </div>
      </div>
    </div>
  );
};
