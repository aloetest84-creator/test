import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { useToast } from '@/hooks/use-toast';

export function OfflineIndicator() {
  const { isOnline, syncOfflineAnalyses, getUnsyncedCount } = useOfflineStorage();
  const { toast } = useToast();
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);
  const unsyncedCount = getUnsyncedCount();

  useEffect(() => {
    if (isOnline && unsyncedCount > 0) {
      setShowSyncPrompt(true);
    } else {
      setShowSyncPrompt(false);
    }
  }, [isOnline, unsyncedCount]);

  const handleSync = async () => {
    try {
      await syncOfflineAnalyses();
      toast({
        title: "Sync complete",
        description: `${unsyncedCount} analyses synced successfully`,
      });
      setShowSyncPrompt(false);
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync offline analyses. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Connection Status */}
      <div className="fixed top-4 right-4 z-40">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
          isOnline 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isOnline ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Sync Prompt */}
      {showSyncPrompt && (
        <div className="fixed top-16 left-4 right-4 z-40 max-w-[393px] mx-auto">
          <Card className="bg-white border border-[#1c8567]/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-[#063528] mb-1">Sync Available</h3>
                  <p className="text-sm text-[#063528]/70">
                    {unsyncedCount} offline analyses ready to sync
                  </p>
                </div>
                <Button
                  onClick={handleSync}
                  size="sm"
                  className="bg-[#1c8567] text-white ml-3"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Sync
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}