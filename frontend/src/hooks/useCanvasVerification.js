/**
 * Hook to verify Canvas data with backend
 * This adds security by verifying the signature server-side
 */

import { useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useCanvasVerification = () => {
  /**
   * Verify Canvas signed_request with backend
   * 
   * Usage:
   * const { verify, loading, error } = useCanvasVerification();
   * const data = await verify(signedRequest);
   */
  const verify = useCallback(async (signedRequest) => {
    try {
      console.log('[Canvas] Sending signed_request to backend for verification...');

      const response = await fetch(`${API_URL}/api/canvas/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          signed_request: signedRequest
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Canvas] Verification failed:', error);
        throw new Error(error.error || 'Verification failed');
      }

      const data = await response.json();
      console.log('[Canvas] ✅ Verification successful');
      console.log('[Canvas] User:', data.user?.userName);
      console.log('[Canvas] Parameters:', data.parameters);

      return data;

    } catch (err) {
      console.error('[Canvas] Verification error:', err);
      throw err;
    }
  }, []);

  /**
   * Extract Canvas data (simpler, also verifies signature)
   */
  const extract = useCallback(async (signedRequest) => {
    try {
      console.log('[Canvas] Sending signed_request to backend for extraction...');

      const response = await fetch(`${API_URL}/api/canvas/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signedRequest: signedRequest
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Extraction failed');
      }

      const data = await response.json();
      console.log('[Canvas] ✅ Extraction successful');
      return data;

    } catch (err) {
      console.error('[Canvas] Extraction error:', err);
      throw err;
    }
  }, []);

  return {
    verify,
    extract
  };
};

export default useCanvasVerification;
