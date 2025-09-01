import { useState, useEffect } from 'react';
import { Brain, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { modelService } from '@/services/modelService';

export function ModelStatus() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = () => {
    setIsLoaded(modelService.isModelLoaded());
  };

  const handleLoadModel = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await modelService.loadModel();
      await modelService.warmUp();
      setIsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="rounded-xl border-[0.5px] border-[#1c85672e] shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-[#1c8567] animate-spin" />
            ) : isLoaded ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : error ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Brain className="w-5 h-5 text-[#1c8567]/60" />
            )}
            
            <div>
              <p className="text-sm font-medium text-[#063528]">
                AI Model Status
              </p>
              <p className="text-xs text-[#063528]/70">
                {isLoading ? 'Loading...' : 
                 isLoaded ? 'Ready for analysis' : 
                 error ? 'Failed to load' : 
                 'Not loaded'}
              </p>
            </div>
          </div>
          
          {!isLoaded && !isLoading && (
            <Button
              onClick={handleLoadModel}
              size="sm"
              className="bg-[#1c8567] text-white"
            >
              Load Model
            </Button>
          )}
        </div>
        
        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}