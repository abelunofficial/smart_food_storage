import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { storageService } from '../../services';

interface ConnectionIndicatorProps {
  className?: string;
  variant?: 'compact' | 'full';
  isLive?: boolean;
  isHardwareConnected?: boolean;
}

/**
 * Hardware Connection Indicator
 *
 * Displays three distinct connection states:
 * 1. Live + Hardware Connected: Green badge, "ESP32: Connected (Blynk Cloud)"
 * 2. Live + Hardware Disconnected: Red/Rose badge, "ESP32: Disconnected (Offline)"
 * 3. Demo Mode: Amber/Slate badge, "ESP32: Disconnected (Demo Telemetry)"
 */
export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  className = '',
  variant = 'full',
  isLive = storageService.isLive(),
  isHardwareConnected: propIsHardwareConnected,
}) => {
  const [internalHardwareOnline, setInternalHardwareOnline] = useState<boolean | null>(null);

  useEffect(() => {
    if (propIsHardwareConnected !== undefined || !isLive) {
      return;
    }

    let isMounted = true;
    const checkStatus = async () => {
      try {
        const status = await storageService.getDeviceStatus();
        if (isMounted) {
          setInternalHardwareOnline(status.isHardwareConnected);
        }
      } catch {
        if (isMounted) {
          setInternalHardwareOnline(false);
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLive, propIsHardwareConnected]);

  const hardwareOnline = propIsHardwareConnected !== undefined ? propIsHardwareConnected : internalHardwareOnline;

  // Case 1: Live Blynk configured and hardware is confirmed online
  if (isLive && hardwareOnline === true) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium shadow-2xs ${className}`}
        title="Connected to Blynk IoT Cloud. Streaming live ESP32 hardware telemetry."
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Wifi className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
        <span className="tracking-tight">
          {variant === 'compact' ? (
            <span>Live (Blynk)</span>
          ) : (
            <span>
              <span className="font-semibold text-emerald-950">ESP32:</span> Connected (Blynk Cloud)
            </span>
          )}
        </span>
      </div>
    );
  }

  // Case 2: Live Blynk configured BUT physical hardware is disconnected (Offline)
  if (isLive && hardwareOnline === false) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-900 text-xs font-medium shadow-2xs ${className}`}
        title="Blynk Cloud token is configured, but the physical ESP32 device is offline or unreachable."
      >
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <WifiOff className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
        <span className="tracking-tight">
          {variant === 'compact' ? (
            <span className="font-semibold text-rose-700">Offline (Hardware)</span>
          ) : (
            <span>
              <span className="font-semibold text-rose-950">ESP32:</span> Disconnected (Offline)
            </span>
          )}
        </span>
      </div>
    );
  }

  // Case 3: Demo / Simulated environment
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-medium shadow-2xs ${className}`}
      title="Hardware is currently disconnected. Telemetry is provided via centralized mock demonstration data."
    >
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
      <span className="tracking-tight">
        {variant === 'compact' ? (
          <span>Disconnected (Demo)</span>
        ) : (
          <span>
            <span className="font-semibold text-amber-950">ESP32:</span> Disconnected (Demo Telemetry)
          </span>
        )}
      </span>
    </div>
  );
};
