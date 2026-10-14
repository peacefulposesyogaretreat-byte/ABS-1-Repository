import React, { useState } from 'react';
import { Property, ChannelId, RoomUnit } from '../types/hotel';
import { CHANNEL_CONFIGS } from '../data/initialData';
import { CheckCircle2, RefreshCw, ShieldCheck, Zap, Sliders, ExternalLink, Settings, Edit3 } from 'lucide-react';

interface ChannelSyncManagerProps {
  properties: Property[];
  onTriggerSync: (channelId?: ChannelId) => void;
  isSyncing: boolean;
  onUpdateUnitMapping: (propertyId: string, unitId: string, mapping: RoomUnit['channelMapping']) => void;
}

export const ChannelSyncManager: React.FC<ChannelSyncManagerProps> = ({
  properties,
  onTriggerSync,
  isSyncing,
  onUpdateUnitMapping,
}) => {
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    propertyId: string;
    unitId: string;
    bookingRoomId: string;
    agodaRoomId: string;
    mmtRoomId: string;
    airbnbListingId: string;
  } | null>(null);

  const [channelToggles, setChannelToggles] = useState<Record<ChannelId, boolean>>({
    booking: true,
    airbnb: true,
    agoda: true,
    makemytrip: true,
    direct: true,
  });

  const [channelFrequencies, setChannelFrequencies] = useState<Record<ChannelId, string>>({
    booking: 'Real-time Webhook (<1s)',
    airbnb: '1 min 2-Way Push',
    agoda: 'Real-time YCS Push',
    makemytrip: 'Real-time IngoMMT',
    direct: 'Instant Mutex',
  });

  const channels: ChannelId[] = ['booking', 'airbnb', 'agoda', 'makemytrip'];

  const handleStartEdit = (propId: string, unit: RoomUnit) => {
    setEditingUnitId(unit.id);
    setEditForm({
      propertyId: propId,
      unitId: unit.id,
      bookingRoomId: unit.channelMapping.bookingRoomId,
      agodaRoomId: unit.channelMapping.agodaRoomId,
      mmtRoomId: unit.channelMapping.mmtRoomId,
      airbnbListingId: unit.channelMapping.airbnbListingId,
    });
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    onUpdateUnitMapping(editForm.propertyId, editForm.unitId, {
      bookingRoomId: editForm.bookingRoomId,
      agodaRoomId: editForm.agodaRoomId,
      mmtRoomId: editForm.mmtRoomId,
      airbnbListingId: editForm.airbnbListingId,
    });
    setEditingUnitId(null);
    setEditForm(null);
  };

  return (
    <div className="space-y-6">
      {/* 4 OTA Health & Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {channels.map((ch) => {
          const cfg = CHANNEL_CONFIGS[ch];
          const isEnabled = channelToggles[ch];

          return (
            <div
              key={ch}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs"
                      style={{ backgroundColor: cfg.brandColor }}
                    >
                      {cfg.logoLetter}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{cfg.name}</h3>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Ping: {cfg.lastPingMs}ms
                      </div>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Live
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Sync Interval:</span>
                    <span className="font-semibold text-slate-900">{channelFrequencies[ch]}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Mapped Units:</span>
                    <span className="font-semibold text-slate-900 tabular-nums">12 / 12 units</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Auto-Block on Sale:</span>
                    <span className="text-emerald-700 font-semibold">Enabled (0 Double Bookings)</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onTriggerSync(ch)}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Feed</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Auto-Stop:</span>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) =>
                      setChannelToggles((prev) => ({ ...prev, [ch]: e.target.checked }))
                    }
                    className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Property & Room Mapping Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                OTA Channel Room ID & Listing Mapping Matrix
              </h2>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                12 Units Configured
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Every cottage and room is mapped to each OTA channel identifier. Whenever a booking is
              received on one ID, ABS-1 Resort Manager halts sales on the other 3 mapped IDs automatically.
            </p>
          </div>

          <button
            onClick={() => onTriggerSync()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Verifying Channels...' : 'Verify All 4 Mappings'}</span>
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-3 px-4">Property & Room Name</th>
                <th className="py-3 px-4">Base Rate</th>
                <th className="py-3 px-4 text-blue-900">Booking.com Room ID</th>
                <th className="py-3 px-4 text-rose-900">Airbnb Listing ID</th>
                <th className="py-3 px-4 text-teal-900">Agoda Room ID</th>
                <th className="py-3 px-4 text-red-900">MakeMyTrip ID</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {properties.map((prop) => (
                <React.Fragment key={prop.id}>
                  <tr className="bg-slate-100/70 font-semibold text-slate-900 text-xs">
                    <td colSpan={7} className="py-2.5 px-4">
                      {prop.name} ({prop.tagline})
                    </td>
                  </tr>

                  {prop.units.map((unit) => {
                    const isEditing = editingUnitId === unit.id;

                    if (isEditing && editForm) {
                      return (
                        <tr key={unit.id} className="bg-indigo-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {unit.name}
                            <div className="text-[10px] text-slate-500 font-normal">
                              {unit.bedConfig}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono">${unit.basePrice}</td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editForm.bookingRoomId}
                              onChange={(e) =>
                                setEditForm({ ...editForm, bookingRoomId: e.target.value })
                              }
                              className="w-full text-xs font-mono border border-slate-300 rounded px-2 py-1 bg-white"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editForm.airbnbListingId}
                              onChange={(e) =>
                                setEditForm({ ...editForm, airbnbListingId: e.target.value })
                              }
                              className="w-full text-xs font-mono border border-slate-300 rounded px-2 py-1 bg-white"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editForm.agodaRoomId}
                              onChange={(e) =>
                                setEditForm({ ...editForm, agodaRoomId: e.target.value })
                              }
                              className="w-full text-xs font-mono border border-slate-300 rounded px-2 py-1 bg-white"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editForm.mmtRoomId}
                              onChange={(e) =>
                                setEditForm({ ...editForm, mmtRoomId: e.target.value })
                              }
                              className="w-full text-xs font-mono border border-slate-300 rounded px-2 py-1 bg-white"
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={handleSaveEdit}
                                className="px-2.5 py-1 bg-slate-900 text-white rounded font-semibold text-xs hover:bg-slate-800"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUnitId(null);
                                  setEditForm(null);
                                }}
                                className="px-2 py-1 text-slate-600 hover:bg-slate-200 rounded text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {unit.name}
                          <div className="text-[10px] text-slate-500 font-normal">
                            {unit.bedConfig}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                          ${unit.basePrice}/night
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-blue-900">
                          {unit.channelMapping.bookingRoomId}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-rose-900">
                          {unit.channelMapping.airbnbListingId}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-teal-900">
                          {unit.channelMapping.agodaRoomId}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-red-900">
                          {unit.channelMapping.mmtRoomId}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleStartEdit(prop.id, unit)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="Edit Channel IDs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
