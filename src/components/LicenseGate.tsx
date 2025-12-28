'use client';

import { useState, useEffect, ReactNode } from 'react';
import {
  verifyLicense,
  activateLicense,
  storeLicense,
  getStoredLicense,
  clearStoredLicense,
  needsReVerification,
  LicenseInfo
} from '@/lib/servicedock';

interface LicenseGateProps {
  children: ReactNode;
  systemId?: string;
  appName?: string;
}

export default function LicenseGate({ children, systemId, appName = 'Application' }: LicenseGateProps) {
  const [isLicensed, setIsLicensed] = useState<boolean | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkStoredLicense();
  }, []);

  const checkStoredLicense = async () => {
    const stored = getStoredLicense();
    if (stored && stored.licenseKey) {
      if (needsReVerification()) {
        // Re-verify stored license
        const result = await verifyLicense(stored.licenseKey, systemId);
        if (result.success && result.valid && result.license) {
          storeLicense(stored.licenseKey, result.license);
          setLicenseInfo(result.license);
          setIsLicensed(true);
        } else {
          clearStoredLicense();
          setIsLicensed(false);
        }
      } else {
        setLicenseInfo(stored.licenseInfo);
        setIsLicensed(true);
      }
    } else {
      setIsLicensed(false);
    }
  };

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First verify the license
      const verifyResult = await verifyLicense(licenseKey.trim(), systemId);

      if (!verifyResult.success || !verifyResult.valid) {
        setError(verifyResult.message || 'Invalid license key');
        setIsLoading(false);
        return;
      }

      // Then activate on this device
      const activateResult = await activateLicense(licenseKey.trim());

      if (activateResult.success && (activateResult.activated || activateResult.already_activated)) {
        if (verifyResult.license) {
          storeLicense(licenseKey.trim(), verifyResult.license);
          setLicenseInfo(verifyResult.license);
        }
        setIsLicensed(true);
      } else {
        setError(activateResult.message || 'Activation failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    clearStoredLicense();
    setLicenseInfo(null);
    setIsLicensed(false);
    setLicenseKey('');
  };

  // Loading state
  if (isLicensed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying license...</p>
        </div>
      </div>
    );
  }

  // License activation form
  if (!isLicensed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{appName}</h1>
            <p className="text-gray-500 mt-2">Enter your license key to continue</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Key
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center tracking-wider"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Activating...' : 'Activate License'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Need a license?{' '}
              <a
                href="https://service-dock-vercel.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Purchase on ServiceDock
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Licensed - show app with license info header
  return (
    <div className="min-h-screen">
      {/* License status bar */}
      <div className="bg-green-50 border-b border-green-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-green-700">
              Licensed: {licenseInfo?.system_name || appName}
              {licenseInfo?.expires_at && !licenseInfo.is_perpetual && (
                <span className="text-green-600 ml-2">
                  (Expires: {new Date(licenseInfo.expires_at).toLocaleDateString()})
                </span>
              )}
              {licenseInfo?.is_perpetual && (
                <span className="text-green-600 ml-2">(Perpetual License)</span>
              )}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-green-700 hover:text-green-900 underline"
          >
            Deactivate
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
