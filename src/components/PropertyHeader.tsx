import React from 'react';
import { Property, Reservation } from '../types/hotel';
import { ShieldCheck, CheckCircle2, Building, RefreshCw, Home, MapPin } from 'lucide-react';

interface PropertyHeaderProps {
  properties: Property[];
  selectedPropertyId: string;
  onSelectProperty: (id: string) => void;
  reservations: Reservation[];
  onSyncAll: () => void;
  isSyncing: boolean;
}

export const PropertyHeader: React.FC<PropertyHeaderProps> = ({
  properties,
  selectedPropertyId,
  onSelectProperty,
  reservations,
  onSyncAll,
  isSyncing,
}) => {
  const currentProperty = properties.find((p) => p.id === selectedPropertyId);

  // Calculate metrics
  const totalUnits =
    selectedPropertyId === 'all'
      ? properties.reduce((acc, p) => acc + p.units.length, 0)
      : currentProperty?.units.length || 0;

  const relevantReservations = reservations.filter((r) => {
    if (r.status === 'cancelled') return false;
    if (selectedPropertyId === 'all') return true;
    return r.propertyId === selectedPropertyId;
  });

  // Unique occupied units right now
  const occupiedUnitIds = new Set(relevantReservations.map((r) => r.unitId));
  const occupancyPercentage = totalUnits > 0 ? Math.round((occupiedUnitIds.size / totalUnits) * 100) : 0;

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Top Segment: Property Selector & Live Sync Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Channel Sync Status: Active</span>
              <span aria-hidden="true">·</span>
              <span>Booking.com · Agoda · MakeMyTrip · Airbnb</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Double-Booking Guard Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {selectedPropertyId === 'all' ? 'All Hotel Inventory' : currentProperty?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {selectedPropertyId === 'all'
                ? 'Managing 2 boutique properties · 12 total bookable units synchronized across 4 OTAs'
                : `${currentProperty?.tagline} · ${currentProperty?.location}`}
            </p>
          </div>

          {/* Property Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start md:self-auto border border-slate-200">
            <button
              onClick={() => onSelectProperty('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                selectedPropertyId === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All (12 Units)
            </button>
            {properties.map((prop) => (
              <button
                key={prop.id}
                onClick={() => onSelectProperty(prop.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  selectedPropertyId === prop.id
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {prop.name.split(' ')[0]} {prop.id === 'prop-1' ? '(5+1)' : '(6 Rms)'}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Property Spotlight (When filtered to single property) */}
        {currentProperty && selectedPropertyId !== 'all' && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-4 h-32 rounded-lg overflow-hidden relative shadow-sm border border-slate-200">
              <img
                src={currentProperty.image}
                alt={currentProperty.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-2.5">
                <span className="text-xs font-medium text-white flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {currentProperty.location}
                </span>
              </div>
            </div>

            <div className="md:col-span-8 flex flex-col justify-between">
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {currentProperty.description}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-mono tabular-nums">
                <span className="text-slate-800 font-sans font-medium">Units breakdown:</span>
                {currentProperty.id === 'prop-1' ? (
                  <>
                    <span>5 Detached Cottages (Garden, Bamboo, Pond)</span>
                    <span aria-hidden="true">·</span>
                    <span>1 Main Villa Heritage Suite</span>
                  </>
                ) : (
                  <>
                    <span>2 Courtyard Rooms (Level 1)</span>
                    <span aria-hidden="true">·</span>
                    <span>2 Balcony & Atrium Rooms (Level 2)</span>
                    <span aria-hidden="true">·</span>
                    <span>2 Rooftop & Atelier Suites (Level 3)</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Inventory Capacity</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
              {totalUnits} <span className="text-xs font-normal text-slate-500">keys managed</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Active Bookings</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
              {relevantReservations.length} <span className="text-xs font-normal text-slate-500">upcoming stays</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Occupancy Rate</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
              {occupancyPercentage}% <span className="text-xs font-normal text-slate-500">current period</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
            <div className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider flex items-center justify-between">
              <span>Overbooking Rate</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-900 mt-0.5 tabular-nums">
              0.0% <span className="text-xs font-normal text-emerald-700">Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
