import React, { useState } from 'react';
import { Property, Reservation, RoomUnit } from '../types/hotel';
import { generateICalFeed, downloadICalFile, parseICalText } from '../utils/icalGenerator';
import { Download, Copy, Check, Code, ExternalLink, RefreshCw, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ICalFeedsManagerProps {
  properties: Property[];
  reservations: Reservation[];
  onImportEvents: (unitId: string, events: Array<{ summary: string; dtstart: string; dtend: string; uid: string }>) => void;
}

export const ICalFeedsManager: React.FC<ICalFeedsManagerProps> = ({
  properties,
  reservations,
  onImportEvents,
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(properties[0].units[0].id);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [showRawFeed, setShowRawFeed] = useState<boolean>(false);
  const [testImportText, setTestImportText] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);

  // Find unit across properties
  let currentUnit: RoomUnit | undefined;
  let currentProperty: Property | undefined;

  for (const p of properties) {
    const found = p.units.find((u) => u.id === selectedUnitId);
    if (found) {
      currentUnit = found;
      currentProperty = p;
      break;
    }
  }

  if (!currentUnit) {
    currentUnit = properties[0].units[0];
    currentProperty = properties[0];
  }

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleTestParse = () => {
    if (!testImportText.trim()) return;
    const events = parseICalText(testImportText);
    setParsedPreview(events);
    if (events.length > 0) {
      onImportEvents(selectedUnitId, events);
    }
  };

  const rawICalOutput = generateICalFeed(currentUnit, reservations);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 w-fit mb-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Standard RFC 5545 2-Way Calendar Feeds</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              OTA iCal Synchronization & Feeds
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Export high-precision availability feeds to Booking.com Extranet, Airbnb Calendar Sync,
              Agoda YCS, and MakeMyTrip IngoMMT. Whenever a reservation is confirmed or dates are blocked,
              the export URL updates instantaneously.
            </p>
          </div>

          {/* Unit Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Select Room / Cottage:</label>
            <select
              value={selectedUnitId}
              onChange={(e) => {
                setSelectedUnitId(e.target.value);
                setParsedPreview(null);
              }}
              className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {properties.map((p) => (
                <optgroup key={p.id} label={p.name}>
                  {p.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2-Way Feed Controller for Selected Unit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Export Feed */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Export iCal Feed</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Live Active
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Paste this link into Booking.com, Airbnb, Agoda, or MMT calendar import fields.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {currentUnit.name} Feed URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUnit.icalExportUrl}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
              />
              <button
                onClick={() => handleCopy(currentUnit.icalExportUrl)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-xs"
              >
                {copiedUrl === currentUnit.icalExportUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              onClick={() => downloadICalFile(currentUnit, reservations)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download .ics File</span>
            </button>

            <button
              onClick={() => setShowRawFeed(!showRawFeed)}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{showRawFeed ? 'Hide RFC 5545 Text' : 'Inspect Raw .ics Format'}</span>
            </button>
          </div>

          {/* Raw iCal Code View */}
          {showRawFeed && (
            <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto text-[11px] font-mono text-emerald-400 max-h-56 custom-scrollbar">
              <pre>{rawICalOutput}</pre>
            </div>
          )}
        </div>

        {/* Right: Connected Import Channels for this Unit */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Inbound OTA iCal Feeds ({currentUnit.name})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ABS-1 Resort Manager pulls these feeds every 60 seconds to detect any external bookings.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="overflow-hidden pr-2">
                <span className="font-bold text-blue-900">Booking.com Inbound iCal</span>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  {currentUnit.icalImportUrls.booking || 'Not configured'}
                </div>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold shrink-0">
                Synced
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="overflow-hidden pr-2">
                <span className="font-bold text-rose-900">Airbnb Inbound iCal</span>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  {currentUnit.icalImportUrls.airbnb || 'Not configured'}
                </div>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold shrink-0">
                Synced
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="overflow-hidden pr-2">
                <span className="font-bold text-teal-900">Agoda Inbound iCal</span>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  {currentUnit.icalImportUrls.agoda || 'Not configured'}
                </div>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold shrink-0">
                Synced
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="overflow-hidden pr-2">
                <span className="font-bold text-red-900">MakeMyTrip Inbound iCal</span>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  {currentUnit.icalImportUrls.makemytrip || 'Not configured'}
                </div>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold shrink-0">
                Synced
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive iCal Feed Importer & Parser Lab */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">
          Feed Parser & External Calendar Test Importer
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Paste any raw iCal feed from an OTA to verify parser syntax and simulate importing external
          blocks into {currentUnit.name}.
        </p>

        <div className="mt-3">
          <textarea
            rows={4}
            value={testImportText}
            onChange={(e) => setTestImportText(e.target.value)}
            placeholder={`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:20261102\nDTEND;VALUE=DATE:20261105\nSUMMARY:Reserved (Agoda Guest)\nUID:ext-test-123\nEND:VEVENT\nEND:VCALENDAR`}
            className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          />

          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={() => {
                setTestImportText(`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:20261103\nDTEND;VALUE=DATE:20261107\nSUMMARY:External Booking (Agoda Customer)\nUID:agoda-import-9988\nEND:VEVENT\nEND:VCALENDAR`);
              }}
              className="text-xs text-slate-600 hover:text-slate-900 underline"
            >
              Insert Sample OTA iCal Payload
            </button>

            <button
              onClick={handleTestParse}
              disabled={!testImportText.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Parse & Sync Feed to {currentUnit.name}
            </button>
          </div>
        </div>

        {parsedPreview && (
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-950">
            <span className="font-bold">Parsed Events ({parsedPreview.length}):</span>
            <div className="mt-1 space-y-1 font-mono text-[11px]">
              {parsedPreview.map((ev, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{ev.summary}</span>
                  <span className="text-slate-500">| {ev.dtstart} ➜ {ev.dtend}</span>
                  <span className="text-slate-400">UID: {ev.uid}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
