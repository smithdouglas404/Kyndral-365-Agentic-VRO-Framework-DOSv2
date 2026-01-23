/**
 * Excel/Google Sheets MCP (Model Context Protocol) Server
 *
 * Purpose: Ingest project data from Excel files and Google Sheets
 * Many organizations track projects in spreadsheets before/alongside PPM tools
 *
 * Supports:
 * - Excel (.xlsx, .xls) file uploads
 * - Google Sheets via API
 * - CSV files
 * - Configurable column mapping
 */

import * as XLSX from 'xlsx';
import type { IStorage } from '../storage.js';

interface SheetConfig {
  googleSheetsApiKey?: string;
  defaultColumnMapping?: ColumnMapping;
}

interface ColumnMapping {
  projectName: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  budget?: string;
  budgetSpent?: string;
  owner?: string;
  priority?: string;
  portfolio?: string;
  expectedROI?: string;
  division?: string;
}

interface ParsedProject {
  name: string;
  description?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  budgetSpent?: number;
  owner?: string;
  priority?: string;
  portfolio?: string;
  expectedROI?: string;
  division?: string;
  rawData: Record<string, any>;
}

export class ExcelSheetsMCP {
  private storage: IStorage;
  private config: SheetConfig;

  // Default column name patterns to look for
  private defaultMapping: ColumnMapping = {
    projectName: 'project name|name|project|title',
    description: 'description|desc|summary|overview',
    status: 'status|state|phase',
    startDate: 'start date|start|begin date|planned start',
    endDate: 'end date|end|finish date|target date|planned end',
    budget: 'budget|total budget|cost|funding',
    budgetSpent: 'spent|actual cost|burn|expended',
    owner: 'owner|manager|pm|project manager|lead',
    priority: 'priority|importance|rank',
    portfolio: 'portfolio|program',
    expectedROI: 'roi|expected roi|return|value',
    division: 'division|business unit|bu|department',
  };

  constructor(storage: IStorage, config?: SheetConfig) {
    this.storage = storage;
    this.config = config || {};

    console.log('[ExcelSheetsMCP] Initialized');
  }

  /**
   * Parse Excel file from buffer
   */
  async parseExcelFile(fileBuffer: Buffer, sheetName?: string): Promise<ParsedProject[]> {
    try {
      console.log('[ExcelSheetsMCP] Parsing Excel file...');

      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

      // Use specified sheet or first sheet
      const sheet = sheetName
        ? workbook.Sheets[sheetName]
        : workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        throw new Error(`Sheet not found: ${sheetName || workbook.SheetNames[0]}`);
      }

      // Convert sheet to JSON
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

      console.log(`[ExcelSheetsMCP] Found ${jsonData.length} rows`);

      // Detect column mapping
      const columnMapping = this.detectColumnMapping(jsonData[0]);

      // Parse rows into projects
      const projects = jsonData.map(row => this.parseRow(row, columnMapping));

      console.log(`[ExcelSheetsMCP] Parsed ${projects.length} projects`);
      return projects.filter(p => p.name); // Filter out rows without names
    } catch (error) {
      console.error('[ExcelSheetsMCP] Error parsing Excel file:', error);
      throw error;
    }
  }

  /**
   * Parse CSV file
   */
  async parseCSVFile(fileContent: string): Promise<ParsedProject[]> {
    try {
      console.log('[ExcelSheetsMCP] Parsing CSV file...');

      // Simple CSV parsing (for complex CSVs, would use a library)
      const lines = fileContent.split('\n').filter(l => l.trim());
      if (lines.length === 0) {
        throw new Error('Empty CSV file');
      }

      // First line is headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const columnMapping = this.detectColumnMapping(
        Object.fromEntries(headers.map(h => [h, '']))
      );

      // Parse data rows
      const projects: ParsedProject[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row = Object.fromEntries(
          headers.map((h, idx) => [h, values[idx]])
        );
        const project = this.parseRow(row, columnMapping);
        if (project.name) {
          projects.push(project);
        }
      }

      console.log(`[ExcelSheetsMCP] Parsed ${projects.length} projects from CSV`);
      return projects;
    } catch (error) {
      console.error('[ExcelSheetsMCP] Error parsing CSV file:', error);
      throw error;
    }
  }

  /**
   * Fetch data from Google Sheets
   */
  async fetchGoogleSheet(spreadsheetId: string, sheetName: string = 'Sheet1'): Promise<ParsedProject[]> {
    try {
      if (!this.config.googleSheetsApiKey) {
        throw new Error('Google Sheets API key not configured');
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${this.config.googleSheetsApiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      if (rows.length === 0) {
        throw new Error('Empty Google Sheet');
      }

      // First row is headers
      const headers = rows[0];
      const columnMapping = this.detectColumnMapping(
        Object.fromEntries(headers.map((h: string) => [h, '']))
      );

      // Parse data rows
      const projects: ParsedProject[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = Object.fromEntries(
          headers.map((h: string, idx: number) => [h, rows[i][idx] || ''])
        );
        const project = this.parseRow(row, columnMapping);
        if (project.name) {
          projects.push(project);
        }
      }

      console.log(`[ExcelSheetsMCP] Fetched ${projects.length} projects from Google Sheets`);
      return projects;
    } catch (error) {
      console.error('[ExcelSheetsMCP] Error fetching Google Sheet:', error);
      throw error;
    }
  }

  /**
   * Detect which columns map to which fields
   * Uses fuzzy matching on column names
   */
  private detectColumnMapping(sampleRow: Record<string, any>): Record<string, string> {
    const mapping: Record<string, string> = {};
    const columns = Object.keys(sampleRow);

    for (const [field, patterns] of Object.entries(this.defaultMapping)) {
      const patternList = patterns.split('|');
      const matchedColumn = columns.find(col =>
        patternList.some(pattern =>
          col.toLowerCase().includes(pattern.toLowerCase())
        )
      );

      if (matchedColumn) {
        mapping[field] = matchedColumn;
      }
    }

    console.log('[ExcelSheetsMCP] Detected column mapping:', mapping);
    return mapping;
  }

  /**
   * Parse a single row into a project object
   */
  private parseRow(row: Record<string, any>, mapping: Record<string, string>): ParsedProject {
    const getValue = (field: string): any => {
      const col = mapping[field];
      return col ? row[col] : undefined;
    };

    const parseDate = (value: any): Date | undefined => {
      if (!value) return undefined;
      try {
        // Handle Excel serial dates
        if (typeof value === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          return new Date(excelEpoch.getTime() + value * 86400000);
        }
        return new Date(value);
      } catch {
        return undefined;
      }
    };

    const parseNumber = (value: any): number | undefined => {
      if (!value) return undefined;
      const num = typeof value === 'string'
        ? parseFloat(value.replace(/[$,]/g, ''))
        : Number(value);
      return isNaN(num) ? undefined : num;
    };

    return {
      name: getValue('projectName'),
      description: getValue('description'),
      status: this.normalizeStatus(getValue('status')),
      startDate: parseDate(getValue('startDate')),
      endDate: parseDate(getValue('endDate')),
      budget: parseNumber(getValue('budget')),
      budgetSpent: parseNumber(getValue('budgetSpent')),
      owner: getValue('owner'),
      priority: this.normalizePriority(getValue('priority')),
      portfolio: getValue('portfolio'),
      expectedROI: getValue('expectedROI'),
      division: getValue('division'),
      rawData: row,
    };
  }

  /**
   * Normalize status values to standard set
   */
  private normalizeStatus(status: any): string | undefined {
    if (!status) return undefined;

    const statusStr = status.toString().toLowerCase();
    const statusMap: Record<string, string> = {
      'active': 'in_progress',
      'in progress': 'in_progress',
      'ongoing': 'in_progress',
      'planning': 'planning',
      'planned': 'planning',
      'on hold': 'on_hold',
      'paused': 'on_hold',
      'complete': 'completed',
      'completed': 'completed',
      'done': 'completed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
    };

    return statusMap[statusStr] || 'in_progress';
  }

  /**
   * Normalize priority values
   */
  private normalizePriority(priority: any): string | undefined {
    if (!priority) return undefined;

    const priorityStr = priority.toString().toLowerCase();
    if (priorityStr.includes('high') || priorityStr.includes('critical')) return 'high';
    if (priorityStr.includes('medium') || priorityStr.includes('normal')) return 'medium';
    if (priorityStr.includes('low')) return 'low';

    return 'medium'; // default
  }

  /**
   * Import projects to database
   */
  async importProjectsToDatabase(projects: ParsedProject[]): Promise<number> {
    let importedCount = 0;

    for (const project of projects) {
      try {
        // Check if project already exists (by name)
        const existingProjects = await this.storage.getProjects();
        const existing = existingProjects.find(p =>
          p.name.toLowerCase() === project.name.toLowerCase()
        );

        if (existing) {
          // Update existing project
          await this.storage.updateProject(existing.id, {
            description: project.description,
            status: project.status as any,
            startDate: project.startDate,
            endDate: project.endDate,
            budget: project.budget?.toString(),
            budgetTotal: project.budget?.toString(),
            budgetSpent: project.budgetSpent?.toString(),
            priority: project.priority as any,
            expectedRoi: project.expectedROI,
          });
          console.log(`[ExcelSheetsMCP] Updated project: ${project.name}`);
        } else {
          // Create new project
          await this.storage.createProject({
            name: project.name,
            description: project.description || '',
            status: (project.status as any) || 'in_progress',
            startDate: project.startDate,
            endDate: project.endDate,
            budget: project.budget?.toString(),
            budgetTotal: project.budget?.toString(),
            budgetSpent: project.budgetSpent?.toString(),
            priority: (project.priority as any) || 'medium',
            expectedRoi: project.expectedROI,
          });
          console.log(`[ExcelSheetsMCP] Created new project: ${project.name}`);
        }

        importedCount++;
      } catch (error) {
        console.error(`[ExcelSheetsMCP] Error importing project ${project.name}:`, error);
      }
    }

    console.log(`[ExcelSheetsMCP] Import complete: ${importedCount} projects imported`);
    return importedCount;
  }

  /**
   * Full workflow: Parse file and import to database
   */
  async processExcelFile(fileBuffer: Buffer, sheetName?: string): Promise<number> {
    const projects = await this.parseExcelFile(fileBuffer, sheetName);
    return await this.importProjectsToDatabase(projects);
  }

  /**
   * Full workflow: Parse CSV and import to database
   */
  async processCSVFile(fileContent: string): Promise<number> {
    const projects = await this.parseCSVFile(fileContent);
    return await this.importProjectsToDatabase(projects);
  }

  /**
   * Full workflow: Fetch Google Sheet and import to database
   */
  async processGoogleSheet(spreadsheetId: string, sheetName?: string): Promise<number> {
    const projects = await this.fetchGoogleSheet(spreadsheetId, sheetName);
    return await this.importProjectsToDatabase(projects);
  }
}

/**
 * Factory function
 */
export function createExcelSheetsMCP(storage: IStorage, config?: SheetConfig): ExcelSheetsMCP {
  return new ExcelSheetsMCP(storage, config);
}
