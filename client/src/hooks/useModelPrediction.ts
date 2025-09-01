import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { modelService, type PredictionResult } from '@/services/modelService';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

export function useModelPrediction() {
  const [isModelLoading, setIsModelLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isOnline, saveOfflineAnalysis } = useOfflineStorage();

  const predictionMutation = useMutation({
    mutationFn: async (file: File): Promise<PredictionResult> => {
      setIsModelLoading(true);
      
      try {
        // Ensure model is loaded
        if (!modelService.isModelLoaded()) {
          toast({
            title: "Preparing AI model...",
            description: "Please wait while we prepare the analysis engine.",
          });
          await modelService.loadModel();
          await modelService.warmUp();
        }

        // Get AI prediction
        const prediction = await modelService.predict(file);
        
        // Save analysis (online or offline)
        let savedAnalysis;
        const analysisData = {
          imagePath: `/uploads/${file.name}`,
          diagnosis: prediction.disease,
          confidence: prediction.confidence,
          severity: prediction.severity,
          description: prediction.description,
          treatment: prediction.treatment,
          isHealthy: prediction.isHealthy,
        };

        if (isOnline) {
          try {
            const res = await apiRequest("POST", "/api/analyses", analysisData);
            savedAnalysis = await res.json();
          } catch (error) {
            // If online save fails, save offline
            savedAnalysis = saveOfflineAnalysis(analysisData);
            toast({
              title: "Saved offline",
              description: "Analysis saved locally. Will sync when online.",
            });
          }
        } else {
          // Save offline
          savedAnalysis = saveOfflineAnalysis(analysisData);
          toast({
            title: "Saved offline",
            description: "Analysis saved locally. Will sync when online.",
          });
        }
        
        return {
          ...prediction,
          id: savedAnalysis.id
        };
      } finally {
        setIsModelLoading(false);
      }
    },
    onSuccess: (result) => {
      // Only invalidate queries if online
      if (isOnline) {
        queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      }
      
      toast({
        title: "Analysis Complete",
        description: `${result.disease} detected with ${Math.round(result.confidence * 100)}% confidence`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze the image. The model may need to be properly converted to TensorFlow.js format.",
        variant: "destructive",
      });
    },
  });

  return {
    predict: predictionMutation.mutateAsync,
    isPredicting: predictionMutation.isPending || isModelLoading,
    predictionError: predictionMutation.error,
    isModelLoading,
  };
}