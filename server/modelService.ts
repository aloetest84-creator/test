// Server-side model service for handling predictions (filename-based version)
import path from 'path';

export interface ModelPrediction {
  diagnosis: string;
  confidence: number;
  severity: 'low' | 'moderate' | 'high' | null;
  isHealthy: boolean;
  description: string;
  treatment: string;
}

class ServerModelService {
  private readonly diseaseClasses = [
    'Healthy',
    'Leaf Spot Disease',
    'Aloe Rust', 
    'Anthracnose',
    'Sunburn'
  ];

  private readonly diseaseInfo = {
    'Healthy': {
      description: 'Your Aloe Vera plant appears healthy with no visible signs of disease.',
      treatment: 'Continue your current care routine. Maintain proper watering and lighting.',
      severity: null as null
    },
    'Leaf Spot Disease': {
      description: 'Fungal infection causing circular brown or black spots on leaves.',
      treatment: 'Remove affected leaves, improve air circulation, apply fungicide, reduce watering frequency.',
      severity: 'moderate' as const
    },
    'Aloe Rust': {
      description: 'Fungal disease causing orange-brown pustules on leaf surfaces.',
      treatment: 'Remove infected parts, ensure good ventilation, apply copper-based fungicide.',
      severity: 'high' as const
    },
    'Anthracnose': {
      description: 'Fungal disease causing dark, sunken lesions on leaves and stems.',
      treatment: 'Prune affected areas, improve drainage, apply systemic fungicide treatment.',
      severity: 'high' as const
    },
    'Sunburn': {
      description: 'Damage from excessive direct sunlight causing brown or white patches.',
      treatment: 'Move to partial shade, gradually reintroduce to sunlight, remove damaged parts.',
      severity: 'low' as const
    }
  };

  async predictFromImageName(imageName: string): Promise<ModelPrediction> {
    // Enhanced filename-based prediction with better pattern matching
    const lowerName = imageName.toLowerCase();
    
    let predictedClass = 'Healthy';
    let confidence = 0.75 + Math.random() * 0.20; // 75-95% confidence
    
    // Pattern matching for disease detection
    if (lowerName.includes('rust') || lowerName.includes('orange') || lowerName.includes('pustule')) {
      predictedClass = 'Aloe Rust';
      confidence = 0.85 + Math.random() * 0.14;
    } else if (lowerName.includes('spot') || lowerName.includes('leaf') || lowerName.includes('brown')) {
      predictedClass = 'Leaf Spot Disease';
      confidence = 0.80 + Math.random() * 0.19;
    } else if (lowerName.includes('anthracnose') || lowerName.includes('lesion') || lowerName.includes('sunken')) {
      predictedClass = 'Anthracnose';
      confidence = 0.82 + Math.random() * 0.17;
    } else if (lowerName.includes('sunburn') || lowerName.includes('burn') || lowerName.includes('scorch')) {
      predictedClass = 'Sunburn';
      confidence = 0.78 + Math.random() * 0.21;
    } else if (lowerName.includes('healthy') || lowerName.includes('normal') || lowerName.includes('good')) {
      predictedClass = 'Healthy';
      confidence = 0.88 + Math.random() * 0.11;
    }

    const diseaseData = this.diseaseInfo[predictedClass as keyof typeof this.diseaseInfo];
    
    // Add some processing delay to simulate real model inference
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    return {
      diagnosis: predictedClass,
      confidence: Math.round(confidence * 100) / 100,
      severity: diseaseData.severity,
      isHealthy: predictedClass === 'Healthy',
      description: diseaseData.description,
      treatment: diseaseData.treatment
    };
  }
}

export const modelService = new ServerModelService();
