import { useState, useEffect } from 'react';
import { Camera, X, Circle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCamera, type CameraCapture } from '@/hooks/useCamera';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  onCapture: (capture: CameraCapture) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function CameraCapture({ onCapture, onClose, isOpen }: CameraCaptureProps) {
  const { toast } = useToast();
  const {
    isCapturing,
    hasPermission,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    requestPermission
  } = useCamera();

  useEffect(() => {
    if (isOpen && hasPermission !== false) {
      startCamera();
    }
    
    return () => {
      if (isCapturing) {
        stopCamera();
      }
    };
  }, [isOpen]);

  const handleCapture = async () => {
    try {
      const capture = await capturePhoto();
      if (capture) {
        onCapture(capture);
        stopCamera();
        onClose();
        toast({
          title: "Photo captured",
          description: "Image ready for analysis",
        });
      } else {
        toast({
          title: "Capture failed",
          description: "Failed to capture photo. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Camera error",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleRetry = async () => {
    const granted = await requestPermission();
    if (granted) {
      await startCamera();
    } else {
      toast({
        title: "Camera permission required",
        description: "Please allow camera access to capture plant photos.",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center">
            <Camera className="w-12 h-12 text-[#1c8567] mx-auto mb-4" />
            <h3 className="font-medium text-[#063528] mb-2">Camera Permission Required</h3>
            <p className="text-sm text-[#063528]/70 mb-4">
              AloeGuard needs camera access to capture plant photos for analysis.
            </p>
            <div className="flex space-x-2">
              <Button onClick={handleRetry} className="flex-1 bg-[#1c8567] text-white">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <Button
          onClick={handleClose}
          variant="ghost"
          className="w-10 h-10 p-0 text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>
        <h2 className="text-white font-medium">Capture Plant Photo</h2>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* Overlay guide */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-white/50 rounded-lg">
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-white"></div>
            <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-white"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-white"></div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-white"></div>
          </div>
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-white text-sm mb-4">Position your Aloe plant within the frame</p>
        </div>
      </div>

      {/* Capture Controls */}
      <div className="p-6 bg-black/50">
        <div className="flex items-center justify-center">
          <Button
            onClick={handleCapture}
            disabled={!isCapturing}
            className="w-16 h-16 rounded-full bg-white hover:bg-gray-200 p-0"
          >
            <Circle className="w-8 h-8 text-black" />
          </Button>
        </div>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}