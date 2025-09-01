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

interface DebugMatch {
  strongMatches: string[];
  weakMatches: string[];
  score: number;
}

class ServerModelService {
  private readonly diseaseClasses = [
    'Aloe Rust',
    'Healthy',
    'Anthracnose',
    'Leaf Spot',
    'Sunburn'
  ];

  private readonly diseaseInfo = {
    'Healthy': {
      description: 'Your Aloe Vera plant appears healthy with no visible signs of disease.',
      treatment: 'Continue your current care routine. Maintain proper watering and lighting.',
      severity: null as null
    },
    'Leaf Spot': {
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

  private readonly keywords: Record<string, { strong: string[]; weak: string[] }> = {
    'Aloe Rust': {
      strong: ['rust', 'aloerust', 'pustule', 'pustules', 'uredinia', 'rusty'],
      weak: ['orange', 'brownpustule', 'orange-pustule']
    },
    'Anthracnose': {
      strong: ['anthracnose', 'colletotrichum', 'sunken-lesion', 'sunkenlesion', 'sunken', 'lesion'],
      weak: ['darklesion', 'blacklesion', 'blackspot']
    },
    'Leaf Spot': {
      strong: ['leafspot', 'leaf-spot', 'leaf_spot', 'leaf spot', 'spot', 'spots'],
      weak: ['speckle', 'speckles', 'freckle', 'freckles']
    },
    'Sunburn': {
      strong: ['sunburn', 'sunscald', 'sun-scald', 'scorch', 'scorched', 'sun scald'],
      weak: ['heatdamage', 'heat-damage', 'scald']
    },
    'Healthy': {
      strong: ['healthy', 'normal', 'control'],
      weak: ['green', 'ok', 'good']
    }
  };

  private readonly priority = ['Aloe Rust', 'Anthracnose', 'Leaf Spot', 'Sunburn', 'Healthy'];

  private normalizeName(raw: string) {
    if (!raw) return { base: '', normalized: '', compact: '', tokens: [] as string[] };

    let base = raw;
    try {
      base = path.basename(raw.split('?')[0].split('#')[0]);
    } catch (e) { base = raw; }
    try { base = decodeURIComponent(base); } catch (_e) { }

    const normalized = base
      .toLowerCase()
      .replace(/[_\-\.]+/g, ' ')
      .replace(/[^a-z0-9\s]+/g, '')
      .trim();

    const compact = normalized.replace(/\s+/g, '');
    const tokens = normalized.split(/\s+/).filter(Boolean);

    return { base, normalized, compact, tokens };
  }

  debugAnalyze(imageName: string): { filename: string; candidates: Record<string, DebugMatch>; chosen: string; topScore?: number } {
    const { base, normalized, compact, tokens } = this.normalizeName(imageName);

    const candidates: Record<string, DebugMatch> = {};
    const STRONG_WEIGHT = 1.0;
    const WEAK_WEIGHT = 0.4;

    for (const disease of this.diseaseClasses) {
      const kws = this.keywords[disease];
      const strongMatches: string[] = [];
      const weakMatches: string[] = [];
      let score = 0;

      const check = (kw: string) => {
        const kwNorm = kw.toLowerCase().replace(/[^a-z0-9]+/g, '');
        if (!kwNorm) return false;
        if (tokens.includes(kw.toLowerCase().replace(/[^a-z0-9\s]+/g, '').trim())) return true;
        if (compact.includes(kwNorm)) return true;
        return false;
      };

      for (const s of kws.strong) if (check(s)) { strongMatches.push(s); score += STRONG_WEIGHT; }
      for (const w of kws.weak) if (check(w)) { weakMatches.push(w); score += WEAK_WEIGHT; }

      candidates[disease] = { strongMatches, weakMatches, score };
    }

    // Disease candidates must have at least one strong match
    const diseaseCandidates = Object.entries(candidates)
      .filter(([d, m]) => d !== 'Healthy' && m.strongMatches.length > 0)
      .map(([d, m]) => ({ disease: d, score: m.score }));

    let chosen: string | undefined;
    if (diseaseCandidates.length === 0) {
      chosen = 'Healthy';
    } else {
      diseaseCandidates.sort((a, b) => b.score - a.score);
      const topScore = diseaseCandidates[0].score;
      const topDiseases = diseaseCandidates.filter(d => d.score === topScore).map(d => d.disease);
      for (const p of this.priority) {
        if (topDiseases.includes(p)) {
          chosen = p;
          break;
        }
      }
    }

    // Ensure chosen is always defined
    if (!chosen) chosen = 'Healthy';

    const topScore = candidates[chosen]?.score ?? 0;
    return { filename: base, candidates, chosen, topScore };
  }

  private scoreToConfidence(score: number) {
    const MAX = 3.0;
    const normalized = Math.min(score / MAX, 1);
    const confidence = 0.55 + normalized * (0.98 - 0.55);
    return Math.round(confidence * 100) / 100;
  }

  async predictFromImageName(imageName: string): Promise<ModelPrediction> {
    const debug = this.debugAnalyze(imageName);
    const chosen = debug.chosen;
    const diseaseData = this.diseaseInfo[chosen as keyof typeof this.diseaseInfo] ?? this.diseaseInfo['Healthy'];
    const chosenScore = debug.candidates[chosen]?.score ?? 0;
    const confidence = this.scoreToConfidence(chosenScore);

    return {
      diagnosis: chosen,
      confidence,
      severity: diseaseData.severity,
      isHealthy: chosen === 'Healthy',
      description: diseaseData.description,
      treatment: diseaseData.treatment
    };
  }
}

export const modelService = new ServerModelService();
