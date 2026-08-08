import { useState } from 'react';
import {
  X,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Activity,
  Save,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { AdminApi } from '../services/api';
import type { CourtCamera } from '../types';

interface ConfigureCourtModalProps {
  court?: CourtCamera | null;
  venueId: string;
  venueName: string;
  onClose: () => void;
  onSaved: () => void;
}

export const ConfigureCourtModal = ({
  court,
  venueId,
  venueName,
  onClose,
  onSaved,
}: ConfigureCourtModalProps) => {
  const isEditing = !!court;

  const [name, setName] = useState(court?.name || '');
  const [courtNumber, setCourtNumber] = useState<number>(court?.courtNumber ?? 1);
  const [piUrl, setPiUrl] = useState(court?.raspberryPiBaseUrl || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTestConnectivity = async () => {
    if (!piUrl.trim()) {
      setTestResult({
        tested: true,
        success: false,
        message: 'Please enter a Raspberry Pi URL first.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await AdminApi.testPiConnectivity(piUrl.trim());
      setTestResult({
        tested: true,
        success: res.success,
        message: res.message || (res.success ? 'Device reached successfully!' : 'Device unreachable.'),
      });
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: err.response?.data?.message || err.message || 'Connection test failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (isEditing && court) {
        await AdminApi.updateCameraMapping(court.cameraId, {
          name: name.trim() || `Court ${courtNumber}`,
          court_number: courtNumber,
          raspberryPiBaseUrl: piUrl.trim() || undefined,
        });
      } else {
        await AdminApi.createCameraMapping({
          turfId: venueId,
          name: name.trim() || `Court ${courtNumber}`,
          court_number: courtNumber,
          raspberryPiBaseUrl: piUrl.trim() || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to save court device configuration.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {isEditing ? 'Configure Court Device' : 'Add Court Device'}
              </h2>
              <p className="text-xs text-zinc-400">{venueName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Court Number
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={courtNumber}
                onChange={(e) => setCourtNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Display Label
              </label>
              <input
                type="text"
                placeholder={`Court ${courtNumber}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Raspberry Pi Gateway Base URL
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">Port 8443 / Tailscale</span>
            </div>
            <div className="relative">
              <input
                type="url"
                placeholder="https://raspberrypi-court11.taild82368.ts.net:8443"
                value={piUrl}
                onChange={(e) => {
                  setPiUrl(e.target.value);
                  setTestResult(null);
                }}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 pr-24"
              />
              <button
                type="button"
                onClick={handleTestConnectivity}
                disabled={isTesting || !piUrl.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-700/50"
              >
                {isTesting ? (
                  <Activity className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Test</span>
              </button>
            </div>

            {/* Quick preset helper */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-zinc-500">Quick insert:</span>
              <button
                type="button"
                onClick={() => {
                  setPiUrl('https://raspberrypi-court11.taild82368.ts.net:8443');
                  setTestResult(null);
                }}
                className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors font-mono"
              >
                Court 11 Tailscale Gateway
              </button>
            </div>
          </div>

          {/* Test Connectivity Result */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs animate-fade-in ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div>
                <div className="font-semibold">
                  {testResult.success ? 'Gateway Online' : 'Gateway Connection Failed'}
                </div>
                <div className="text-[11px] opacity-90 mt-0.5 font-mono">{testResult.message}</div>
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>How Stream Activation Works</span>
            </div>
            <p>
              When an athlete or admin starts a match stream, FieldFlicks backend triggers FFmpeg on
              this Pi URL to encode RTSP $\to$ Mux HLS live stream automatically.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800/80 text-zinc-300 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isEditing ? 'Save Configuration' : 'Add Court'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
