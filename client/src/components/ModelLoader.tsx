import { useEffect, useState } from 'react';
import { Brain, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { modelService } from '@/services/modelService';

interface ModelLoaderProps {
  onLoaded?: () => void;
}

export function ModelLoader({ onLoaded }: ModelLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let progressInterval: NodeJS.Timeout | null = null;

    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simulate loading progress
        progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 85) {
              if (progressInterval) clearInterval(progressInterval);
              return 85;
            }
            return prev + Math.random() * 15 + 5;
          });
        }, 300);

        await modelService.loadModel();
        await modelService.warmUp();
        
        if (progressInterval) clearInterval(progressInterval);
        setProgress(100);
        
        if (mounted) {
          setIsLoading(false);
          onLoaded?.();
        }
      } catch (err) {
        if (progressInterval) clearInterval(progressInterval);
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load AI model';
          setError(errorMessage);
          setIsLoading(false);
          console.error('Model loading error:', err);
        }
      }
    };

    loadModel();

    return () => {
      mounted = false;
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [onLoaded, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setIsLoading(true);
    setProgress(0);
  };

  if (!isLoading && !error) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-[#edfffa] z-50 flex items-center justify-center">
      <Card className="w-full max-w-sm mx-4">
        <CardContent className="p-6 text-center">
          {error ? (
            <>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-medium text-[#063528] mb-2">Model Loading Failed</h3>
              <p className="text-sm text-[#063528]/70 mb-4">{error}</p>
              <div className="space-y-2">
                <Button 
                  onClick={handleRetry}
                  className="bg-[#1c8567] text-white"
                >
                  Try Again
                </Button>
                <p className="text-xs text-[#063528]/50">
                  Note: Convert your Keras model to TensorFlow.js format for full functionality
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="relative w-16 h-16 mx-auto mb-4">
                <Loader2 className="w-16 h-16 text-[#1c8567] animate-spin" />
                <Brain className="w-8 h-8 text-[#063528] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="font-medium text-[#063528] mb-2">Loading AI Model</h3>
              <p className="text-sm text-[#063528]/70 mb-4">
                Preparing disease detection engine...
              </p>
              <div className="w-full bg-[#1c8567]/20 rounded-full h-2 mb-2">
                <div 
                  className="bg-[#1c8567] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-[#063528]/50">{Math.round(progress)}%</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
              >
                Try Again
              </button>
            </>
          ) : (
            <>
              <div className="relative w-16 h-16 mx-auto mb-4">
                <Loader2 className="w-16 h-16 text-[#1c8567] animate-spin" />
                <Brain className="w-8 h-8 text-[#063528] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="font-medium text-[#063528] mb-2">Loading AI Model</h3>
              <p className="text-sm text-[#063528]/70 mb-4">
                Preparing disease detection engine...
              </p>
              <div className="w-full bg-[#1c8567]/20 rounded-full h-2">
                <div 
                  className="bg-[#1c8567] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-[#063528]/50 mt-2">{progress}%</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}