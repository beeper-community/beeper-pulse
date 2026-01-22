#!/usr/bin/env tsx
/**
 * Status check entry point
 */

import { runStatusCheck } from "./checker.js";

runStatusCheck().catch(console.error);
