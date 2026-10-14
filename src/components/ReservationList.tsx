import React, { useState } from 'react';
import { Property, Reservation, ChannelId } from '../types/hotel';
import { CHANNEL_CONFIGS } from '../data/initialData';
import { Search, Filter, Download, Plus, Check, Clock, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';

interface ReservationListProps {
  properties: Property[];
  reservations: Reservation[];
  onSelectReservation: (res: Reservation) => void;
  onNewReservation: () => void;
  onStatusChange: (id: string, status: Reservation['status']) => void;
}

export const ReservationList: React.FC<ReservationListProps> = ({
  properties,
  reservations,
  onSelectReservation,
  onNewReservation,
  onStatusChange,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter reservations
  const filteredReservations = reservations.filter((r) => {
    if (propertyFilter !== 'all' && r.propertyId !== propertyFilter) return false;
    if (channelFilter !== 'all' && r.channel !== channelFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = r.guestName.toLowerCase().includes(q);
      const matchRef = r.channelReference.toLowerCase().includes(q);
      const matchEmail = r.guestEmail.toLowerCase().includes(q);
      if (!matchName && !matchRef && !matchEmail) return false;
    }
    return true;
  });

  const getUnitName = (propertyId: string, unitId: string) => {
    const prop = properties.find((p) => p.id === propertyId);
    const unit = prop?.units.find((u) => u.id === unitId);
    return unit ? unit.name : 'Unknown Unit';
  };

  const getPropertyName = (propertyId: string) => {
    const prop = properties.find((p) => p.id === propertyId);
    return prop ? prop.name : 'Unknown Hotel';
  };

  const exportCSV = () => {
    const headers = ['ID', 'Property', 'Unit', 'Guest Name', 'Email', 'Phone', 'Channel', 'Reference', 'CheckIn', 'CheckOut', 'Nights', 'Total USD', 'Status'];
    const rows = filteredReservations.map((r) => [
      r.id,
      getPropertyName(r.propertyId),
      getUnitName(r.propertyId, r.unitId),
      `"${r.guestName}"`,
      r.guestEmail,
      r.guestPhone,
      r.channel,
      r.channelReference,
      r.checkIn,
      r.checkOut,
      r.nights,
      r.totalPrice,
      r.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hotel_reservations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by guest name, reservation reference, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700"
            >
              <option value="all">All Hotels (12 units)</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700"
            >
              <option value="all">All Channels</option>
              <option value="booking">Booking.com</option>
              <option value="airbnb">Airbnb</option>
              <option value="agoda">Agoda.com</option>
              <option value="makemytrip">MakeMyTrip.com</option>
              <option value="direct">Direct Walk-In</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onNewReservation}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="py-3 px-4">Guest & Reference</th>
              <th className="py-3 px-4">Hotel & Unit</th>
              <th className="py-3 px-4">Channel Source</th>
              <th className="py-3 px-4">Stay Dates</th>
              <th className="py-3 px-4">Nights</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">OTA Auto-Lock</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReservations.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  No reservations matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredReservations.map((res) => {
                const cfg = CHANNEL_CONFIGS[res.channel];

                return (
                  <tr
                    key={res.id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => onSelectReservation(res)}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{res.guestName}</div>
                      <div className="text-[11px] font-mono text-slate-500 font-normal">
                        Ref: {res.channelReference}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {getUnitName(res.propertyId, res.unitId)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {getPropertyName(res.propertyId)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${cfg.badgeBg}`}
                      >
                        {cfg.name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-800 tabular-nums">
                      <div>{res.checkIn}</div>
                      <div className="text-slate-500 text-[10px]">to {res.checkOut}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                      {res.nights} {res.nights === 1 ? 'nt' : 'nts'}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold tabular-nums text-slate-900">
                      ${res.totalPrice}
                    </td>

                    <td className="py-3.5 px-4">
                      {res.status === 'confirmed' ? (
                        <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                        </span>
                      ) : res.status === 'checked_in' ? (
                        <span className="text-[11px] font-medium text-blue-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Checked In
                        </span>
                      ) : res.status === 'checked_out' ? (
                        <span className="text-[11px] font-medium text-slate-600">
                          Checked Out
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-red-700 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Cancelled
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> 3 OTAs Blocked
                      </span>
                    </td>

                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {res.status === 'confirmed' && (
                          <button
                            onClick={() => onStatusChange(res.id, 'checked_in')}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold"
                          >
                            Check In
                          </button>
                        )}
                        {res.status === 'checked_in' && (
                          <button
                            onClick={() => onStatusChange(res.id, 'checked_out')}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold"
                          >
                            Check Out
                          </button>
                        )}
                        <button
                          onClick={() => onSelectReservation(res)}
                          className="px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded text-[11px] font-semibold"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
