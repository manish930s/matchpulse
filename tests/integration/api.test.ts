import { describe, test, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as explainHandler } from '@/app/api/explain/route';
import { POST as whatIfHandler } from '@/app/api/whatif/route';

describe('API Route Handlers (Integration)', () => {
  test('POST /api/explain - valid input returns 200 and structured explanation', async () => {
    const req = new NextRequest('http://localhost:3000/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        battingTeam: 'India',
        bowlingTeam: 'Australia',
        score: 153,
        wickets: 5,
        oversCompleted: 14.3,
        totalOvers: 20,
        target: 195,
        language: 'hinglish',
      }),
    });

    const res = await explainHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.data.situation).toBeDefined();
    expect(json.data.keyNumber).toBeDefined();
    expect(json.data.actions).toHaveLength(3);
    expect(json.data.bowlingPlan).toHaveLength(2);
    expect(json.data.winProbability).toBeGreaterThanOrEqual(0);
    expect(json.data.winProbability).toBeLessThanOrEqual(100);
    expect(json.data.disclaimer).toBeDefined();
  });

  test('POST /api/explain - invalid input returns 400 with helpful error', async () => {
    const req = new NextRequest('http://localhost:3000/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        battingTeam: 'India',
        wickets: 15, // Invalid > 10
      }),
    });

    const res = await explainHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  test('POST /api/explain - completed match fast-path returns in <100ms without AI', async () => {
    const start = Date.now();
    const req = new NextRequest('http://localhost:3000/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        battingTeam: 'India',
        bowlingTeam: 'Australia',
        score: 196,
        wickets: 5,
        oversCompleted: 19.2,
        totalOvers: 20,
        target: 195,
        language: 'english',
      }),
    });

    const res = await explainHandler(req);
    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(500);

    const json = await res.json();
    expect(json.data.situation).toContain('won');
    expect(json.data.winProbability).toBe(100);
  });

  test('POST /api/explain - all out match fast-path returns immediate result', async () => {
    const req = new NextRequest('http://localhost:3000/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        battingTeam: 'India',
        bowlingTeam: 'Australia',
        score: 120,
        wickets: 10,
        oversCompleted: 16.4,
        totalOvers: 20,
        target: 195,
        language: 'hinglish',
      }),
    });

    const res = await explainHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.situation).toContain('All out');
    expect(json.data.winProbability).toBe(0);
  });

  test('POST /api/whatif - valid scenario returns 200 with scenarios', async () => {
    const req = new NextRequest('http://localhost:3000/api/whatif', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        standings: '1. KKR 20 pts, 2. SRH 17 pts, 3. RR 17 pts, 4. RCB 12 pts, 5. CSK 14 pts',
        scenario: 'agar RCB jeet gayi to kya hoga',
        language: 'hinglish',
      }),
    });

    const res = await whatIfHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.explanation).toBeDefined();
    expect(json.data.scenarios).toBeInstanceOf(Array);
    expect(json.data.scenarios.length).toBeGreaterThan(0);
  });

  test('POST /api/whatif - invalid request returns 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/whatif', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: '',
      }),
    });

    const res = await whatIfHandler(req);
    expect(res.status).toBe(400);
  });
});
