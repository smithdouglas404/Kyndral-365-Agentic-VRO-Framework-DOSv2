/**
 * MASTRA CLOUD CONFIGURATION
 *
 * This file configures Mastra for cloud sync.
 * Run `npx mastra dev` to start the server and see agents in Mastra Cloud.
 */

import { Mastra } from '@mastra/core';
import { CloudExporter } from '@mastra/core/ai-tracing';

import { pmoAgent } from './agents/pmo';
import { finopsAgent } from './agents/finops';
import { riskAgent } from './agents/risk';
import { ocmAgent } from './agents/ocm';
import { tmoAgent } from './agents/tmo';
import { vroAgent } from './agents/vro';
import { governanceAgent } from './agents/governance';
import { planningAgent } from './agents/planning';

import * as tools from './tools';

export const mastra = new Mastra({
  agents: {
    pmoAgent,
    finopsAgent,
    riskAgent,
    ocmAgent,
    tmoAgent,
    vroAgent,
    governanceAgent,
    planningAgent,
  },
  tools,
  observability: {
    default: { enabled: true },
    cloud: {
      enabled: true,
      exporter: new CloudExporter({
        accessToken: process.env.MASTRA_CLOUD_ACCESS_TOKEN,
      }),
    },
  },
});
