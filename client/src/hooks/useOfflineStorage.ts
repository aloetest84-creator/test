import { useState, useEffect } from 'react';

interface OfflineAnalysis {
  id: string;
  imagePath: string;
  diagnosis: string;
  confidence: number;
  severity: string | null;
  description: string;
  treatment: string;
  isHealthy: boolean;
  timestamp: number;
  synced: boolean;
}

export function useOfflineStorage() {
  const [offlineAnalyses, setOfflineAnalyses] = useState<OfflineAnalysis[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Load offline analyses from localStorage
    const stored = localStorage.getItem('aloe-offline-analyses');
    if (stored) {
      try {
        setOfflineAnalyses(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse offline analyses:', error);
      }
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveOfflineAnalysis = (analysis: Omit<OfflineAnalysis, 'id' | 'timestamp' | 'synced'>) => {
    const newAnalysis: OfflineAnalysis = {
      ...analysis,
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false
    };

    const updated = [...offlineAnalyses, newAnalysis];
    setOfflineAnalyses(updated);
    localStorage.setItem('aloe-offline-analyses', JSON.stringify(updated));
    
    return newAnalysis;
  };

  const syncOfflineAnalyses = async () => {
    if (!isOnline) return;

    const unsyncedAnalyses = offlineAnalyses.filter(analysis => !analysis.synced);
    let syncedCount = 0;
    
    for (const analysis of unsyncedAnalyses) {
      try {
        const response = await fetch('/api/analyses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            imagePath: analysis.imagePath,
            diagnosis: analysis.diagnosis,
            confidence: analysis.confidence,
            severity: analysis.severity,
            description: analysis.description,
            treatment: analysis.treatment,
            isHealthy: analysis.isHealthy,
          }),
        });

        if (response.ok) {
          // Mark as synced
          const updated = offlineAnalyses.map(a => 
            a.id === analysis.id ? { ...a, synced: true } : a
          );
          setOfflineAnalyses(updated);
          localStorage.setItem('aloe-offline-analyses', JSON.stringify(updated));
          syncedCount++;
        }
      } catch (error) {
        console.error('Failed to sync analysis:', analysis.id, error);
      }
    }

    return syncedCount;
  };

  const clearSyncedAnalyses = () => {
    const unsynced = offlineAnalyses.filter(analysis => !analysis.synced);
    setOfflineAnalyses(unsynced);
    localStorage.setItem('aloe-offline-analyses', JSON.stringify(unsynced));
  };

  const getUnsyncedCount = () => {
    return offlineAnalyses.filter(analysis => !analysis.synced).length;
  };

  return {
    offlineAnalyses,
    isOnline,
    saveOfflineAnalysis,
    syncOfflineAnalyses,
    clearSyncedAnalyses,
    getUnsyncedCount
  };
}