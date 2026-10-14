import React, { useState } from 'react';
import { Property, RoomUnit, ChannelId } from '../types/hotel';
import { DollarSign, ShieldAlert, Check, RefreshCw, SlidersHorizontal, Lock } from 'lucide-react';

interface RatesAvailabilityManagerProps {
  properties: Property[];
  onUpdateUnitRate: (propertyId: string, unitId: string, newPrice: number) => void;
  onBulkStopSell: (unitId: string, isClosed: boolean) => void;
  onSyncPush: (message: string) => void;
}

export const RatesAvailabilityManager: React.FC<RatesAvailabilityManagerProps> = ({
  properties,
  onUpdateUnitRate,
  onBulkStopSell,
  onSyncPush,
}) => {
  const [closedUnits, setClosedUnits] = useState<Record<string, boolean>>({});
  const [channelMarkups, setChannelMarkups] = useState<Record<ChannelId, number>>({
    booking: 0,
    agoda: 0,
    makemytrip: 0,
    airbnb: 5, // 5% host markup common for Airbnb
    direct: -5, // 5% direct booking discount
  });
  const [bulkAdjustment, setBulkAdjustment] = useState<number>(0);

  const toggleCloseOut = (unitId: string, unitName: string) => {
    const nextState = !closedUnits[unitId];
    setClosedUnits((prev) => ({ ...prev, [unitId]: nextState }));
    onBulkStopSell(unitId, nextState);
    onSyncPush(
      nextState
        ? `Stop-Sell pushed: ${unitName} closed out across Booking.com, Agoda, MMT, Airbnb`
        : `Stop-Sell lifted: ${unitName} reopened for sales across all 4 OTAs`
    );
  };

  const calculateChannelRate = (basePrice: number, ch: ChannelId) => {
    const markupPct = channelMarkups[ch] || 0;
    return Math.round(basePrice * (1 + markupPct / 100));
  };

  const handleApplyBulkRate = (propertyId: string) => {
    if (bulkAdjustment === 0) return;
    const prop = properties.find((p) => p.id === propertyId);
    if (!prop) return;

    for (const u of prop.units) {
      const newPrice = Math.max(50, u.basePrice + bulkAdjustment);
      onUpdateUnitRate(propertyId, u.id, newPrice);
    }
    onSyncPush(`Bulk rate adjustment applied: ${bulkAdjustment > 0 ? '+' : ''}$${bulkAdjustment} across ${prop.name}`);
    setBulkAdjustment(0);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 w-fit mb-2">
              <DollarSign className="w-4 h-4 text-slate-700" />
              <span>Multi-OTA Rate Parity & Stop-Sell Control</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Rates, Channel Markups & Emergency Stop-Sell
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Maintain price parity or apply calculated margin compensations across Booking.com,
              Agoda, MakeMyTrip, and Airbnb. Emergency Stop-Sell instantly zeroes inventory across all 4
              platforms simultaneously.
            </p>
          </div>

          {/* Quick Channel Markup Controls */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="font-bold text-slate-800 block mb-2">Channel Markup Rules:</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-blue-900 font-semibold">Booking:</span>
                <span className="font-mono">{channelMarkups.booking}% (Parity)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-teal-900 font-semibold">Agoda:</span>
                <span className="font-mono">{channelMarkups.agoda}% (Parity)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-red-900 font-semibold">MMT:</span>
                <span className="font-mono">{channelMarkups.makemytrip}% (Parity)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-rose-900 font-semibold">Airbnb:</span>
                <span className="font-mono">+{channelMarkups.airbnb}% (Fee Offset)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tables for each property */}
      {properties.map((prop) => (
        <div key={prop.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {prop.name} ({prop.tagline})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {prop.units.length} total units · Synchronized on all 4 connected OTAs
              </p>
            </div>

            {/* Bulk adjustment for this property */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Bulk Adjust:</span>
              <input
                type="number"
                placeholder="± $"
                value={bulkAdjustment || ''}
                onChange={(e) => setBulkAdjustment(Number(e.target.value))}
                className="w-20 text-xs border border-slate-300 rounded px-2 py-1 font-mono text-center"
              />
              <button
                onClick={() => handleApplyBulkRate(prop.id)}
                disabled={bulkAdjustment === 0}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded transition-colors"
              >
                Apply to All {prop.units.length} Units
              </button>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-white border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-3 px-4">Room / Cottage Unit</th>
                  <th className="py-3 px-4">Base Rack Rate</th>
                  <th className="py-3 px-4 text-blue-900">Booking.com Rate</th>
                  <th className="py-3 px-4 text-teal-900">Agoda Rate</th>
                  <th className="py-3 px-4 text-red-900">MakeMyTrip Rate</th>
                  <th className="py-3 px-4 text-rose-900">Airbnb Rate (+5%)</th>
                  <th className="py-3 px-4 text-center">Stop-Sell Status</th>
                  <th className="py-3 px-4 text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prop.units.map((unit) => {
                  const isClosed = !!closedUnits[unit.id];

                  return (
                    <tr
                      key={unit.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isClosed ? 'bg-red-50/40 text-slate-400' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {unit.name}
                        <div className="text-[10px] text-slate-500 font-normal">
                          {unit.bedConfig}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold tabular-nums text-slate-900">
                        ${unit.basePrice}
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-blue-900">
                        ${calculateChannelRate(unit.basePrice, 'booking')}
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-teal-900">
                        ${calculateChannelRate(unit.basePrice, 'agoda')}
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-red-900">
                        ${calculateChannelRate(unit.basePrice, 'makemytrip')}
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-rose-900">
                        ${calculateChannelRate(unit.basePrice, 'airbnb')}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isClosed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                            <Lock className="w-3 h-3" />
                            Closed Out (Stop-Sell)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <Check className="w-3 h-3" />
                            Open on All 4 OTAs
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => toggleCloseOut(unit.id, unit.name)}
                          className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-colors whitespace-nowrap ${
                            isClosed
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          {isClosed ? 'Reopen on All OTAs' : 'Emergency Stop-Sell'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};
