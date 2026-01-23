/**
 * Seed EVM (Earned Value Management) and Sprint data for all projects
 * Fixes "NO_DATA" issue by adding realistic CPI, SPI, velocity, etc.
 */

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper to generate realistic EVM metrics
function generateEVMMetrics(projectStatus: string, daysIntoProject: number) {
  const basePerformance = projectStatus === 'active' ? 0.92 : projectStatus === 'completed' ? 1.05 : 0.75;
  const variance = Math.random() * 0.2 - 0.1; // ±10% variance

  const cpi = Math.max(0.65, Math.min(1.25, basePerformance + variance));
  const spi = Math.max(0.70, Math.min(1.20, basePerformance + variance * 0.8));

  // Planned Value (PV) - what should have been done
  const pv = Math.floor((daysIntoProject / 365) * 5000000); // $5M annual budget

  // Earned Value (EV) - what was actually completed
  const ev = Math.floor(pv * spi);

  // Actual Cost (AC) - what was actually spent
  const ac = Math.floor(ev / cpi);

  // Cost Variance (CV) = EV - AC
  const cv = ev - ac;

  // Schedule Variance (SV) = EV - PV
  const sv = ev - pv;

  // Budget at Completion (BAC)
  const bac = 5000000;

  // Estimate at Completion (EAC) = BAC / CPI
  const eac = Math.floor(bac / cpi);

  // Estimate to Complete (ETC) = EAC - AC
  const etc = eac - ac;

  // Variance at Completion (VAC) = BAC - EAC
  const vac = bac - eac;

  // To Complete Performance Index (TCPI) = (BAC - EV) / (BAC - AC)
  const tcpi = (bac - ev) / (bac - ac);

  return {
    cpi: cpi.toFixed(2),
    spi: spi.toFixed(2),
    pv: pv.toString(),
    ev: ev.toString(),
    ac: ac.toString(),
    cv: cv.toString(),
    sv: sv.toString(),
    bac: bac.toString(),
    eac: eac.toString(),
    etc: etc.toString(),
    vac: vac.toString(),
    tcpi: tcpi.toFixed(2),
    evm_last_updated: new Date().toISOString()
  };
}

// Helper to generate realistic Sprint metrics
function generateSprintMetrics(projectStatus: string) {
  if (projectStatus !== 'active' && projectStatus !== 'planning') {
    return {
      sprint_active: 'false',
      sprint_number: null,
      sprint_velocity: null,
      sprint_capacity: null,
      sprint_burndown: null
    };
  }

  const sprintNumber = Math.floor(Math.random() * 20) + 1;
  const targetVelocity = 40;
  const actualVelocity = Math.floor(targetVelocity + (Math.random() * 20 - 10));
  const capacity = Math.floor(actualVelocity * 1.2);
  const daysRemaining = Math.floor(Math.random() * 10) + 1;
  const totalStoryPoints = actualVelocity;
  const completedStoryPoints = Math.floor(totalStoryPoints * (10 - daysRemaining) / 10);

  return {
    sprint_active: 'true',
    sprint_number: sprintNumber.toString(),
    sprint_velocity: actualVelocity.toString(),
    sprint_capacity: capacity.toString(),
    sprint_status: actualVelocity >= targetVelocity ? 'on-track' : 'at-risk',
    sprint_progress: Math.floor((completedStoryPoints / totalStoryPoints) * 100).toString(),
    sprint_burndown: JSON.stringify({
      days: Array.from({ length: 10 }, (_, i) => i + 1),
      ideal: Array.from({ length: 10 }, (_, i) => totalStoryPoints - (totalStoryPoints / 10) * (i + 1)),
      actual: Array.from({ length: daysRemaining }, (_, i) => totalStoryPoints - (completedStoryPoints / daysRemaining) * (i + 1))
    })
  };
}

// Helper to generate blockers
function generateBlockers(projectStatus: string, cpi: number, spi: number) {
  if (projectStatus === 'completed' || projectStatus === 'archived') {
    return [];
  }

  const blockers = [];

  if (parseFloat(cpi) < 0.85) {
    blockers.push({
      description: 'Budget overrun detected - requires FinOps review',
      severity: 'critical',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      resolved: 'false'
    });
  }

  if (parseFloat(spi) < 0.80) {
    blockers.push({
      description: 'Schedule delay - dependency on external team',
      severity: 'high',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      resolved: 'false'
    });
  }

  if (Math.random() > 0.7 && projectStatus === 'active') {
    blockers.push({
      description: 'Waiting for architecture decision from TMO',
      severity: 'medium',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      resolved: 'false'
    });
  }

  return blockers;
}

async function seedEVMSprintData() {
  try {
    console.log("🚀 Starting EVM and Sprint data seeding...");

    // Get all projects
    const projectsResult = await pool.query(`
      SELECT id, name, status, created_at FROM projects
    `);

    console.log(`📊 Found ${projectsResult.rows.length} projects to update`);

    let updatedCount = 0;

    for (const project of projectsResult.rows) {
      const daysIntoProject = Math.floor(
        (Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Generate EVM metrics
      const evmMetrics = generateEVMMetrics(project.status, daysIntoProject);

      // Generate Sprint metrics
      const sprintMetrics = generateSprintMetrics(project.status);

      // Generate blockers based on performance
      const blockers = generateBlockers(project.status, parseFloat(evmMetrics.cpi), parseFloat(evmMetrics.spi));

      // Calculate predictability based on velocity
      const velocityNum = sprintMetrics.sprint_velocity ? parseInt(sprintMetrics.sprint_velocity) : 0;
      const predictabilityValue = velocityNum >= 40 ? '85%' : velocityNum >= 30 ? '75%' : '65%';
      const flowEfficiencyValue = sprintMetrics.sprint_status === 'on-track' ? '85' : '65';

      // Update project with explicit columns
      await pool.query(`
        UPDATE projects
        SET
          cpi_value = $1,
          spi_value = $2,
          planned_value = $3,
          earned_value = $4,
          actual_cost = $5,
          cv = $6,
          sv = $7,
          bac = $8,
          eac = $9,
          etc = $10,
          vac = $11,
          velocity = $12,
          flow_efficiency = $13,
          predictability = $14
        WHERE id = $15
      `, [
        parseFloat(evmMetrics.cpi),
        parseFloat(evmMetrics.spi),
        parseFloat(evmMetrics.pv),
        parseFloat(evmMetrics.ev),
        evmMetrics.ac,
        parseFloat(evmMetrics.cv),
        parseFloat(evmMetrics.sv),
        parseFloat(evmMetrics.bac),
        parseFloat(evmMetrics.eac),
        parseFloat(evmMetrics.etc),
        parseFloat(evmMetrics.vac),
        sprintMetrics.sprint_velocity,
        flowEfficiencyValue,
        predictabilityValue,
        project.id
      ]);

      updatedCount++;

      if (updatedCount % 10 === 0) {
        console.log(`✅ Updated ${updatedCount}/${projectsResult.rows.length} projects...`);
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} projects with EVM and Sprint data`);

    // Show sample of metrics
    const sampleResult = await pool.query(`
      SELECT
        name,
        status,
        cpi_value as cpi,
        spi_value as spi,
        velocity,
        flow_efficiency
      FROM projects
      WHERE status = 'active'
      LIMIT 5
    `);

    console.log("\n📈 Sample of seeded data:");
    console.table(sampleResult.rows);

    // Show statistics
    const statsResult = await pool.query(`
      SELECT
        status,
        COUNT(*) as count,
        ROUND(CAST(AVG(cpi_value) AS NUMERIC), 2) as avg_cpi,
        ROUND(CAST(AVG(spi_value) AS NUMERIC), 2) as avg_spi,
        ROUND(AVG(CAST(NULLIF(velocity, '') AS NUMERIC)), 0) as avg_velocity,
        COUNT(*) FILTER (WHERE cpi_value < 0.85) as projects_over_budget
      FROM projects
      GROUP BY status
    `);

    console.log("\n📊 Statistics by project status:");
    console.table(statsResult.rows);

  } catch (error: any) {
    console.error("❌ Error seeding EVM/Sprint data:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedEVMSprintData();
