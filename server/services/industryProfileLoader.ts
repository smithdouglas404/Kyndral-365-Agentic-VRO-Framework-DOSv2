/**
 * INDUSTRY PROFILE LOADER
 *
 * Loads industry-specific ontologies, metrics, and terminology
 * based on company's GICS/NAICS codes.
 *
 * Applied during company discovery to provide industry-relevant:
 * - Standard KPIs and metrics
 * - Organizational structure types
 * - Industry terminology
 * - Compliance frameworks
 * - OKR categories
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { ontologyIndustryProfiles } from '../db/schema.js';

// Handle both ESM and CommonJS builds
const __filename = typeof import.meta !== 'undefined' && import.meta.url
  ? fileURLToPath(import.meta.url)
  : path.join(process.cwd(), 'dist', 'services', 'industryProfileLoader.js');
const __dirname = path.dirname(__filename);

export interface IndustryMetric {
  name: string;
  category: string;
  unit: string;
  description: string;
  typical_target: string | number;
  frequency: string;
}

export interface IndustryProfile {
  id: string;
  name: string;
  codes: {
    gics: string[];
    naics: string[];
  };
  terminology: {
    orgUnits: Record<string, string>;
    projectTypes: string[];
    safeMapping: {
      valueStreams: string[];
      arts: string[];
    };
  };
  standardMetrics: IndustryMetric[];
  complianceFrameworks: string[];
  commonOKRCategories: string[];
}

interface IndustryData {
  industries: IndustryProfile[];
}

let cachedIndustries: IndustryProfile[] | null = null;

/**
 * Load all industry profiles (from database, fallback to JSON)
 */
async function loadIndustryProfilesFromDB(): Promise<IndustryProfile[]> {
  try {
    const profiles = await db.select().from(ontologyIndustryProfiles);

    if (profiles.length === 0) {
      console.log('[IndustryProfileLoader] No profiles in database, loading from JSON');
      return loadIndustryProfilesFromJSON();
    }

    // Convert database format to IndustryProfile format
    return profiles.map(profile => ({
      id: profile.industryName.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-'),
      name: profile.industryName,
      codes: {
        gics: [profile.industryCode || ''],
        naics: [],
      },
      terminology: {
        orgUnits: (profile.primaryClasses as Record<string, string>) || {},
        projectTypes: ((profile.classExtensions as any)?.projectTypes as string[]) || [],
        safeMapping: {
          valueStreams: ((profile.classExtensions as any)?.safeMapping?.valueStreams as string[]) || [],
          arts: ((profile.classExtensions as any)?.safeMapping?.arts as string[]) || [],
        },
      },
      standardMetrics: (profile.standardMetrics as IndustryMetric[]) || [],
      complianceFrameworks: ((profile.classExtensions as any)?.complianceFrameworks as string[]) || [],
      commonOKRCategories: ((profile.classExtensions as any)?.okrCategories as string[]) || [],
    }));
  } catch (error) {
    console.error('[IndustryProfileLoader] Database load failed, falling back to JSON:', error);
    return loadIndustryProfilesFromJSON();
  }
}

/**
 * Load all industry profiles from JSON file (fallback)
 */
function loadIndustryProfilesFromJSON(): IndustryProfile[] {
  try {
    const filePath = path.join(__dirname, '../ontology/industries.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data: IndustryData = JSON.parse(fileContent);
    return data.industries;
  } catch (error) {
    console.error('[IndustryProfileLoader] Failed to load industries from JSON:', error);
    return [];
  }
}

/**
 * Load all industry profiles (cached)
 */
function loadIndustryProfiles(): IndustryProfile[] {
  if (cachedIndustries) {
    return cachedIndustries;
  }

  // For synchronous calls, use JSON fallback
  // Async callers should use loadIndustryProfilesFromDB()
  return loadIndustryProfilesFromJSON();
}

/**
 * Get industry profile by GICS code
 */
export function getIndustryByGICS(gicsCode: string): IndustryProfile | null {
  const industries = loadIndustryProfiles();

  // Try exact match first
  let match = industries.find(ind =>
    ind.codes.gics.some(code => code === gicsCode)
  );

  // Try prefix match (e.g., "45" matches "4510", "4520")
  if (!match) {
    match = industries.find(ind =>
      ind.codes.gics.some(code => gicsCode.startsWith(code) || code.startsWith(gicsCode))
    );
  }

  return match || null;
}

/**
 * Get industry profile by NAICS code
 */
export function getIndustryByNAICS(naicsCode: string): IndustryProfile | null {
  const industries = loadIndustryProfiles();

  // Try exact match first
  let match = industries.find(ind =>
    ind.codes.naics.some(code => code === naicsCode)
  );

  // Try prefix match (e.g., "52" matches "5221", "5231")
  if (!match) {
    match = industries.find(ind =>
      ind.codes.naics.some(code => naicsCode.startsWith(code) || code.startsWith(naicsCode))
    );
  }

  return match || null;
}

/**
 * Get industry profile from company candidate data
 */
export function getIndustryFromCompany(companyCodes: {
  naics?: string[];
  gics?: { code: string };
}): IndustryProfile | null {
  // Try GICS first (more specific for public companies)
  if (companyCodes.gics?.code) {
    const profile = getIndustryByGICS(companyCodes.gics.code);
    if (profile) return profile;
  }

  // Try NAICS
  if (companyCodes.naics && companyCodes.naics.length > 0) {
    for (const naicsCode of companyCodes.naics) {
      const profile = getIndustryByNAICS(naicsCode);
      if (profile) return profile;
    }
  }

  return null;
}

/**
 * Get all available industry profiles
 */
export function getAllIndustries(): IndustryProfile[] {
  return loadIndustryProfiles();
}

/**
 * Get industry-specific Claude extraction prompt
 */
export function getIndustryExtractionPrompt(industry: IndustryProfile): string {
  return `
You are extracting data from a ${industry.name} company's annual report.

**Industry Context:**
- Standard metrics for this industry include: ${industry.standardMetrics.slice(0, 5).map(m => m.name).join(', ')}
- Common organizational units: ${Object.values(industry.terminology.orgUnits).slice(0, 4).join(', ')}
- Typical compliance frameworks: ${industry.complianceFrameworks.slice(0, 3).join(', ')}
- Common OKR categories: ${industry.commonOKRCategories.slice(0, 3).join(', ')}

**Extraction Focus:**
When extracting metrics, prioritize industry-specific KPIs like ${industry.standardMetrics.slice(0, 3).map(m => m.name).join(', ')}.

When identifying organizational units, look for terms like ${Object.keys(industry.terminology.orgUnits).slice(0, 3).join(', ')}.

When extracting governance rules, focus on ${industry.complianceFrameworks.slice(0, 2).join(' and ')} compliance requirements.
`;
}

/**
 * Map industry profile to database format for seeding
 */
export function toDatabase(industry: IndustryProfile) {
  return {
    industry_name: industry.name,
    industry_code: industry.codes.gics[0] || industry.codes.naics[0],
    primary_classes: industry.terminology.orgUnits,
    class_extensions: industry.terminology.safeMapping,
    standard_metrics: industry.standardMetrics,
  };
}

/**
 * Enrich company data with industry-specific metadata
 */
export function enrichCompanyWithIndustry(
  companyData: any,
  industry: IndustryProfile
): any {
  return {
    ...companyData,
    industry_profile: {
      id: industry.id,
      name: industry.name,
      suggested_metrics: industry.standardMetrics.slice(0, 10),
      compliance_frameworks: industry.complianceFrameworks,
      okr_categories: industry.commonOKRCategories,
    },
    extraction_context: {
      expected_org_unit_types: Object.keys(industry.terminology.orgUnits),
      expected_metric_categories: [...new Set(industry.standardMetrics.map(m => m.category))],
      value_stream_suggestions: industry.terminology.safeMapping.valueStreams,
    },
  };
}
