import { callLLM } from '../lib/OpenRouterClient.js';
import { getIndustryFromCompany, enrichCompanyWithIndustry, type IndustryProfile } from './industryProfileLoader.js';

export interface CompanyCandidate {
  legalName: string;
  doingBusinessAs?: string;
  headquarters: {
    city: string;
    state?: string;
    country: string;
    fullAddress?: string;
  };
  industryCodes: {
    naics?: string[];
    sic?: string[];
    gics?: {
      sector: string;
      industryGroup: string;
      industry: string;
      subIndustry: string;
      code: string;
    };
  };
  entityIdentifiers: {
    lei?: string; // Legal Entity Identifier
    cik?: string; // SEC Central Index Key
    ticker?: string;
    companyNumber?: string; // Companies House, OpenCorporates
  };
  confidenceScore: number;
  dataSources: string[];
}

/**
 * Search SEC EDGAR for company information
 */
async function searchSECEdgar(companyName: string): Promise<CompanyCandidate[]> {
  try {
    // SEC EDGAR Company Search API
    const searchUrl = `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(companyName)}&action=getcompany&output=json`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Company Profile System (contact@example.com)', // SEC requires User-Agent
      }
    });

    if (!response.ok) {
      console.error('SEC EDGAR search failed:', response.statusText);
      return [];
    }

    const data = await response.json();

    // Also fetch company facts for more detailed info
    if (data.cik) {
      const cik = data.cik.padStart(10, '0');
      const factsUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;

      try {
        const factsResponse = await fetch(factsUrl, {
          headers: { 'User-Agent': 'Company Profile System (contact@example.com)' }
        });

        if (factsResponse.ok) {
          const facts = await factsResponse.json();

          return [{
            legalName: facts.entityName || data.name,
            headquarters: {
              city: facts.addresses?.business?.city || '',
              state: facts.addresses?.business?.stateOrCountry || '',
              country: 'USA',
              fullAddress: `${facts.addresses?.business?.street1 || ''}, ${facts.addresses?.business?.city || ''}, ${facts.addresses?.business?.stateOrCountry || ''}`
            },
            industryCodes: {
              sic: [data.sicCode || ''],
              naics: [] // Not directly in SEC data
            },
            entityIdentifiers: {
              cik: cik,
              ticker: data.ticker || undefined
            },
            confidenceScore: 0.90,
            dataSources: ['SEC EDGAR']
          }];
        }
      } catch (err) {
        console.error('Error fetching SEC company facts:', err);
      }
    }

    // Fallback to basic data
    return data.companies?.map((company: any) => ({
      legalName: company.name,
      headquarters: {
        city: company.cityState?.split(', ')[0] || '',
        state: company.cityState?.split(', ')[1] || '',
        country: 'USA'
      },
      industryCodes: {
        sic: [company.sicCode]
      },
      entityIdentifiers: {
        cik: company.cik,
        ticker: company.ticker
      },
      confidenceScore: 0.85,
      dataSources: ['SEC EDGAR']
    })) || [];

  } catch (error) {
    console.error('SEC EDGAR search error:', error);
    return [];
  }
}

/**
 * Search OpenCorporates for company information
 */
async function searchOpenCorporates(companyName: string): Promise<CompanyCandidate[]> {
  try {
    const apiKey = process.env.OPENCORPORATES_API_KEY;
    const baseUrl = apiKey
      ? `https://api.opencorporates.com/v0.4/companies/search`
      : `https://api.opencorporates.com/v0.4.8/companies/search`; // Free tier endpoint

    const params = new URLSearchParams({
      q: companyName,
      per_page: '5',
      ...(apiKey && { api_token: apiKey })
    });

    const response = await fetch(`${baseUrl}?${params}`);

    if (!response.ok) {
      console.error('OpenCorporates search failed:', response.statusText);
      return [];
    }

    const data = await response.json();

    return data.results?.companies?.map((result: any) => {
      const company = result.company;
      return {
        legalName: company.name,
        headquarters: {
          city: company.registered_address?.locality || '',
          state: company.registered_address?.region || '',
          country: company.jurisdiction_code?.split('_')[0]?.toUpperCase() || '',
          fullAddress: company.registered_address_in_full || ''
        },
        industryCodes: {
          sic: company.industry_codes?.map((ic: any) => ic.code) || []
        },
        entityIdentifiers: {
          companyNumber: company.company_number
        },
        confidenceScore: 0.80,
        dataSources: ['OpenCorporates']
      };
    }) || [];

  } catch (error) {
    console.error('OpenCorporates search error:', error);
    return [];
  }
}

/**
 * Enrich company data using AI to parse and standardize
 */
async function enrichCompanyData(
  candidate: CompanyCandidate,
  additionalContext?: string
): Promise<CompanyCandidate> {
  try {
    // Fetch latest 10-K if CIK is available
    let annualReportUrl = '';
    let businessSummary = '';

    if (candidate.entityIdentifiers.cik) {
      const cik = candidate.entityIdentifiers.cik.padStart(10, '0');
      const submissionsUrl = `https://data.sec.gov/submissions/CIK${cik}.json`;

      try {
        const response = await fetch(submissionsUrl, {
          headers: { 'User-Agent': 'Company Profile System (contact@example.com)' }
        });

        if (response.ok) {
          const submissions = await response.json();

          // Find latest 10-K
          const filings = submissions.filings?.recent;
          if (filings) {
            const tenKIndex = filings.form.findIndex((f: string) => f === '10-K');
            if (tenKIndex !== -1) {
              const accessionNumber = filings.accessionNumber[tenKIndex].replace(/-/g, '');
              annualReportUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNumber}/${filings.primaryDocument[tenKIndex]}`;
            }
          }

          // Get business description from tickers if available
          businessSummary = submissions.description || '';
        }
      } catch (err) {
        console.error('Error fetching SEC submissions:', err);
      }
    }

    // Use AI to enhance industry classification and summary
    const prompt = `Analyze this company information and provide enhanced classification:

Company: ${candidate.legalName}
Location: ${candidate.headquarters.city}, ${candidate.headquarters.state || candidate.headquarters.country}
${businessSummary ? `Description: ${businessSummary}` : ''}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Provide:
1. GICS industry classification (Sector, Industry Group, Industry, Sub-Industry, Code)
2. Primary NAICS code and description
3. 2-3 sentence business summary
4. Industry name for matching to our ontology profiles (e.g., "Electric Utilities", "Financial Services", "Technology/SaaS")

Return JSON only:
{
  "gics": {
    "sector": "string",
    "industryGroup": "string",
    "industry": "string",
    "subIndustry": "string",
    "code": "string"
  },
  "primaryNaics": {"code": "string", "description": "string"},
  "businessSummary": "string",
  "industryProfile": "string"
}`;

    const text = await callLLM('', prompt, { maxTokens: 1024, temperature: 0.2 });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const enriched = JSON.parse(jsonMatch[0]);

      return {
        ...candidate,
        industryCodes: {
          ...candidate.industryCodes,
          naics: [enriched.primaryNaics.code],
          gics: enriched.gics
        },
        confidenceScore: Math.min(candidate.confidenceScore + 0.05, 1.0),
        dataSources: [...candidate.dataSources, 'AI Enhancement']
      };
    }

    // Load industry profile based on GICS/NAICS codes
    const industryProfile = getIndustryFromCompany(candidate.industryCodes);
    if (industryProfile) {
      console.log(`[CompanyDiscovery] Matched industry profile: ${industryProfile.name}`);
      candidate = enrichCompanyWithIndustry(candidate, industryProfile);
    } else {
      console.log(`[CompanyDiscovery] No industry profile match for codes:`, candidate.industryCodes);
    }

    return candidate;

  } catch (error) {
    console.error('Error enriching company data:', error);
    return candidate;
  }
}

/**
 * Deduplicate and merge candidates from multiple sources
 */
function deduplicateCandidates(candidates: CompanyCandidate[]): CompanyCandidate[] {
  const merged: Map<string, CompanyCandidate> = new Map();

  for (const candidate of candidates) {
    const key = candidate.legalName.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (merged.has(key)) {
      const existing = merged.get(key)!;

      // Merge data from multiple sources
      merged.set(key, {
        ...existing,
        doingBusinessAs: candidate.doingBusinessAs || existing.doingBusinessAs,
        headquarters: {
          ...existing.headquarters,
          ...candidate.headquarters,
          fullAddress: candidate.headquarters.fullAddress || existing.headquarters.fullAddress
        },
        industryCodes: {
          naics: [...(existing.industryCodes.naics || []), ...(candidate.industryCodes.naics || [])],
          sic: [...(existing.industryCodes.sic || []), ...(candidate.industryCodes.sic || [])],
          gics: candidate.industryCodes.gics || existing.industryCodes.gics
        },
        entityIdentifiers: {
          ...existing.entityIdentifiers,
          ...candidate.entityIdentifiers
        },
        confidenceScore: Math.max(existing.confidenceScore, candidate.confidenceScore),
        dataSources: [...new Set([...existing.dataSources, ...candidate.dataSources])]
      });
    } else {
      merged.set(key, candidate);
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.confidenceScore - a.confidenceScore);
}

/**
 * Main company discovery function
 */
export async function discoverCompanies(
  searchQuery: string,
  filters?: {
    country?: string;
    state?: string;
    industry?: string;
  }
): Promise<CompanyCandidate[]> {
  console.log(`Discovering companies matching: "${searchQuery}"`);

  // Search multiple sources in parallel
  const [secResults, openCorpResults] = await Promise.all([
    searchSECEdgar(searchQuery),
    searchOpenCorporates(searchQuery)
  ]);

  // Combine and deduplicate
  let allCandidates = deduplicateCandidates([...secResults, ...openCorpResults]);

  // Apply filters
  if (filters) {
    allCandidates = allCandidates.filter(candidate => {
      if (filters.country && candidate.headquarters.country !== filters.country) return false;
      if (filters.state && candidate.headquarters.state !== filters.state) return false;
      // Industry filtering would require enrichment first
      return true;
    });
  }

  // Enrich top 5 candidates with AI
  const topCandidates = allCandidates.slice(0, 5);
  const enrichedCandidates = await Promise.all(
    topCandidates.map(candidate => enrichCompanyData(candidate))
  );

  console.log(`Found ${enrichedCandidates.length} company candidates`);

  return enrichedCandidates;
}

/**
 * Get detailed company profile after user selection
 */
export async function getCompanyProfile(candidate: CompanyCandidate): Promise<{
  company: CompanyCandidate;
  latestAnnualReport?: {
    url: string;
    date: string;
    type: string;
  };
  organizationalUnits?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}> {
  const profile: any = {
    company: candidate
  };

  // Fetch latest 10-K if available
  if (candidate.entityIdentifiers.cik) {
    const cik = candidate.entityIdentifiers.cik.padStart(10, '0');
    const submissionsUrl = `https://data.sec.gov/submissions/CIK${cik}.json`;

    try {
      const response = await fetch(submissionsUrl, {
        headers: { 'User-Agent': 'Company Profile System (contact@example.com)' }
      });

      if (response.ok) {
        const submissions = await response.json();
        const filings = submissions.filings?.recent;

        if (filings) {
          const tenKIndex = filings.form.findIndex((f: string) => f === '10-K');
          if (tenKIndex !== -1) {
            const accessionNumber = filings.accessionNumber[tenKIndex].replace(/-/g, '');
            profile.latestAnnualReport = {
              url: `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNumber}/${filings.primaryDocument[tenKIndex]}`,
              date: filings.filingDate[tenKIndex],
              type: '10-K'
            };
          }
        }
      }
    } catch (err) {
      console.error('Error fetching annual report:', err);
    }
  }

  return profile;
}
