import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { modelService, type PredictionResult } from '@/services/modelService';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useModelPrediction() {
  const [isModelLoading, setIsModelLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const predictionMutation = useMutation({
    mutationFn: async (file: File): Promise<PredictionResult> => {
      setIsModelLoading(true);
      
      try {
        // Ensure model is loaded
        if (!modelService.isModelLoaded()) {
          toast({
            title: "Loading AI model...",
            description: "Please wait while we prepare the analysis engine.",
          });
          await modelService.loadModel();
          await modelService.warmUp();
        }

        // Get AI prediction
        const prediction = await modelService.predict(file);
        
        // Save analysis to backend
        const imagePath = `/uploads/${file.name}`;
        const res = await apiRequest("POST", "/api/analyses", {
          imagePath,
          diagnosis: prediction.disease,
          confidence: prediction.confidence,
          severity: prediction.severity,
          description: prediction.description,
          treatment: prediction.treatment,
          isHealthy: prediction.isHealthy,
        });

        const savedAnalysis = await res.json();
        
        return {
          ...prediction,
          id: savedAnalysis.id
        };
      } finally {
        setIsModelLoading(false);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Analysis Complete",
        description: `${result.disease} detected with ${Math.round(result.confidence * 100)}% confidence`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze the image. Please try again.",
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