import { useState, useRef } from 'react';

export interface CameraCapture {
  file: File;
  preview: string;
}

export function useCamera() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      setHasPermission(false);
      return false;
    }
  };

  const startCamera = async (): Promise<boolean> => {
    try {
      if (hasPermission === null) {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsCapturing(true);
      return true;
    } catch (error) {
      console.error('Failed to start camera:', error);
      setHasPermission(false);
      return false;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCapturing(false);
  };

  const capturePhoto = (): Promise<CameraCapture | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current) {
        resolve(null);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        resolve(null);
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        const file = new File([blob], `aloe-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });

        const preview = URL.createObjectURL(blob);

        resolve({ file, preview });
      }, 'image/jpeg', 0.9);
    });
  };

  return {
    isCapturing,
    hasPermission,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    requestPermission
  };
}