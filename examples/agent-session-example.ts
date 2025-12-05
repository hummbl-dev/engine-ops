/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Agent Session Example
 *
 * This example demonstrates how to use the Agent Sessions API to create
 * and manage multi-agent workflows.
 */

const API_BASE = 'http://localhost:3000/api/v1';

/**
 * Helper function to make API requests
 */
async function apiRequest(
  endpoint: string,
  method: string = 'GET',
  body?: unknown,
): Promise<unknown> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error: ${JSON.stringify(data)}`);
  }

  return data;
}

/**
 * Example 1: Create and run a metrics session
 */
async function metricsSessionExample(): Promise<void> {
  console.log('\n=== Metrics Session Example ===\n');

  // Create session
  const session = await apiRequest('/agent-sessions', 'POST', {
    sessionType: 'metrics',
    sessionId: `metrics-${Date.now()}`,
    context: {
      agents: ['MetricsAgent'],
      dataSource: 'prometheus',
      objective: 'Collect CPU and memory metrics',
      additionalSettings: {
        interval: '5s',
        duration: '1h',
      },
    },
  });

  console.log('Created session:', session);

  // Update to running state
  const runningSession = await apiRequest(`/agent-sessions/${session.sessionId}`, 'PATCH', {
    state: 'running',
  });

  console.log('Session running:', runningSession);

  // Simulate work
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Complete with results
  const completedSession = await apiRequest(`/agent-sessions/${session.sessionId}`, 'PATCH', {
    state: 'completed',
    result: {
      metricsCollected: 120,
      avgCpu: 45.2,
      avgMemory: 62.8,
      errors: 0,
    },
  });

  console.log('Session completed:', completedSession);

  return session.sessionId;
}

/**
 * Example 2: Create and run a simulation session
 */
async function simulationSessionExample(): Promise<void> {
  console.log('\n=== Simulation Session Example ===\n');

  const session = await apiRequest('/agent-sessions', 'POST', {
    sessionType: 'simulation',
    sessionId: `sim-ops-${Date.now()}`,
    context: {
      agents: ['DetectionAgent', 'TriageAgent', 'ResolutionAgent', 'AuditAgent'],
      state: { status: 'init' },
      policy: 'ops_policy.json',
      dataSource: 'recent_ops_logs.json',
      objective: 'Simulate incident detection and resolution',
      additionalSettings: {
        maxSteps: 10,
        enableAudit: true,
      },
    },
  });

  console.log('Created simulation session:', session);

  // Update to running
  await apiRequest(`/agent-sessions/${session.sessionId}`, 'PATCH', {
    state: 'running',
  });

  console.log('Simulation running...');

  // Simulate work
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Complete with results
  await apiRequest(`/agent-sessions/${session.sessionId}`, 'PATCH', {
    state: 'completed',
    result: {
      incidentsDetected: 5,
      incidentsTriaged: 5,
      incidentsResolved: 4,
      incidentsFailed: 1,
      totalSteps: 8,
      duration: '3s',
    },
  });

  console.log('Simulation completed');

  return session.sessionId;
}

/**
 * Example 3: Policy enforcement session
 */
async function policySessionExample(): Promise<void> {
  console.log('\n=== Policy Enforcement Example ===\n');

  const session = await apiRequest('/agent-sessions', 'POST', {
    sessionType: 'policy',
    sessionId: `policy-${Date.now()}`,
    context: {
      agents: ['SecurityPolicyAgent'],
      policy: 'security_baseline.json',
      dataSource: 'kubernetes_cluster',
      objective: 'Validate security policies',
    },
  });

  console.log('Created policy session:', session);

  // Update to running
  await apiRequest(`/agent-sessions/${session.sessionId}`, 'PATCH', {
    state: 'running',
  });

  // Simulate work
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Complete with results
  await apiRequest(`/agent-sessions/${session.sessionId}`, 'PATCH', {
    state: 'completed',
    result: {
      policiesChecked: 25,
      policiesViolated: 2,
      violations: ['Container running as root', 'Missing network policy'],
    },
  });

  console.log('Policy check completed');

  return session.sessionId;
}

/**
 * Example 4: List and filter sessions
 */
async function listSessionsExample(_sessionIds: string[]): Promise<void> {
  console.log('\n=== List Sessions Example ===\n');

  // List all sessions
  const allSessions = await apiRequest('/agent-sessions');
  console.log(`Total sessions: ${allSessions.count}`);

  // Filter by type
  const metricsSessions = await apiRequest('/agent-sessions?sessionType=metrics');
  console.log(`Metrics sessions: ${metricsSessions.count}`);

  // Filter by state
  const completedSessions = await apiRequest('/agent-sessions?state=completed');
  console.log(`Completed sessions: ${completedSessions.count}`);

  // Get statistics
  const stats = await apiRequest('/agent-sessions/stats');
  console.log('Session statistics:', stats);
}

/**
 * Example 5: Handle errors
 */
async function errorHandlingExample(): Promise<void> {
  console.log('\n=== Error Handling Example ===\n');

  try {
    // Try to create session with invalid type
    await apiRequest('/agent-sessions', 'POST', {
      sessionType: 'invalid-type',
      sessionId: 'error-test-1',
    });
  } catch (error) {
    console.log('Expected error for invalid type:', (error as Error).message);
  }

  try {
    // Try to get non-existent session
    await apiRequest('/agent-sessions/non-existent-session');
  } catch (error) {
    console.log('Expected error for non-existent session:', (error as Error).message);
  }
}

/**
 * Example 6: Cleanup sessions
 */
async function cleanupExample(sessionIds: string[]): Promise<void> {
  console.log('\n=== Cleanup Example ===\n');

  for (const sessionId of sessionIds) {
    try {
      await apiRequest(`/agent-sessions/${sessionId}`, 'DELETE');
      console.log(`Deleted session: ${sessionId}`);
    } catch (error) {
      console.log(`Failed to delete session ${sessionId}:`, (error as Error).message);
    }
  }
}

/**
 * Run all examples
 */
async function runExamples(): Promise<void> {
  console.log('Starting Agent Session Examples...');
  console.log('Make sure the Engine-Ops server is running on http://localhost:3000\n');

  const sessionIds: string[] = [];

  try {
    // Run examples
    sessionIds.push(await metricsSessionExample());
    sessionIds.push(await simulationSessionExample());
    sessionIds.push(await policySessionExample());

    await listSessionsExample(sessionIds);
    await errorHandlingExample();

    // Cleanup
    await cleanupExample(sessionIds);

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}
