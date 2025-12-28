/**
 * ServiceDock License Integration
 * https://service-dock-vercel.vercel.app
 */

const SERVICEDOCK_API_BASE = 'https://service-dock-vercel.vercel.app/api/v1';

export interface LicenseInfo {
  license_key: string;
  license_id: string;
  system_id: string;
  system_name: string;
  license_type: 'PERPETUAL' | 'MONTHLY' | 'YEARLY';
  status: 'active' | 'inactive' | 'expired';
  expires_at: string | null;
  is_perpetual: boolean;
  max_activations: number;
  activations_used: number;
  remaining_activations: number;
}

export interface VerifyResponse {
  success: boolean;
  valid: boolean;
  license?: LicenseInfo;
  message?: string;
  error?: string;
}

export interface ActivationResponse {
  success: boolean;
  activated: boolean;
  already_activated?: boolean;
  activation?: {
    activation_id: string;
    device_id: string;
    device_name: string;
    activated_at: string;
  };
  license?: {
    license_key: string;
    max_activations: number;
    activations_used: number;
    remaining_activations: number;
  };
  message?: string;
  error?: string;
}

// System ID for this application (to be set in environment)
const SYSTEM_ID = process.env.NEXT_PUBLIC_SERVICEDOCK_SYSTEM_ID || '';

/**
 * Generate unique device ID
 */
export function generateDeviceId(): string {
  const stored = localStorage.getItem('servicedock_device_id');
  if (stored) return stored;

  const newId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem('servicedock_device_id', newId);
  return newId;
}

/**
 * Get device info
 */
export function getDeviceInfo(): { device_name: string; device_type: string; os_type: string; os_version: string; app_version: string } {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let os_type = 'Unknown';
  let os_version = '';

  if (ua.includes('Windows')) {
    os_type = 'Windows';
    const match = ua.match(/Windows NT (\d+\.\d+)/);
    os_version = match ? match[1] : '';
  } else if (ua.includes('Mac')) {
    os_type = 'macOS';
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    os_version = match ? match[1].replace('_', '.') : '';
  } else if (ua.includes('Linux')) {
    os_type = 'Linux';
  }

  return {
    device_name: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown Device',
    device_type: 'Web Browser',
    os_type,
    os_version,
    app_version: '1.0.0'
  };
}

/**
 * Verify license key
 */
export async function verifyLicense(licenseKey: string, systemId?: string): Promise<VerifyResponse> {
  try {
    const response = await fetch(`${SERVICEDOCK_API_BASE}/licenses/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: licenseKey,
        system_id: systemId || SYSTEM_ID
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      valid: false,
      message: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Activate license on this device
 */
export async function activateLicense(licenseKey: string): Promise<ActivationResponse> {
  try {
    const deviceId = generateDeviceId();
    const deviceInfo = getDeviceInfo();

    const response = await fetch(`${SERVICEDOCK_API_BASE}/licenses/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: licenseKey,
        device_id: deviceId,
        device_info: deviceInfo
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      activated: false,
      message: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Store license in localStorage
 */
export function storeLicense(licenseKey: string, licenseInfo: LicenseInfo): void {
  localStorage.setItem('servicedock_license_key', licenseKey);
  localStorage.setItem('servicedock_license_info', JSON.stringify(licenseInfo));
  localStorage.setItem('servicedock_license_verified_at', new Date().toISOString());
}

/**
 * Get stored license
 */
export function getStoredLicense(): { licenseKey: string; licenseInfo: LicenseInfo | null; verifiedAt: string | null } | null {
  const licenseKey = localStorage.getItem('servicedock_license_key');
  if (!licenseKey) return null;

  const infoStr = localStorage.getItem('servicedock_license_info');
  const verifiedAt = localStorage.getItem('servicedock_license_verified_at');

  return {
    licenseKey,
    licenseInfo: infoStr ? JSON.parse(infoStr) : null,
    verifiedAt
  };
}

/**
 * Clear stored license
 */
export function clearStoredLicense(): void {
  localStorage.removeItem('servicedock_license_key');
  localStorage.removeItem('servicedock_license_info');
  localStorage.removeItem('servicedock_license_verified_at');
}

/**
 * Check if re-verification is needed (every 24 hours)
 */
export function needsReVerification(): boolean {
  const verifiedAt = localStorage.getItem('servicedock_license_verified_at');
  if (!verifiedAt) return true;

  const verifiedDate = new Date(verifiedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60);

  return hoursDiff > 24;
}
