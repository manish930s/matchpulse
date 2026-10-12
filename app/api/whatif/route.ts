import { NextRequest, NextResponse } from 'next/server';
import { WhatIfRequestSchema } from '@/lib/types';
import { generateWhatIfExplanation } from '@/lib/gemini';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationResult = WhatIfRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const issue = validationResult.error.issues[0]?.message || 'Invalid what-if parameters';
      return NextResponse.json(
        { error: `Invalid input: ${issue}`, status: 400 },
        { status: 400 }
      );
    }

    const result = await generateWhatIfExplanation(validationResult.data);
    return NextResponse.json({ data: result, status: 200 }, { status: 200 });
  } catch (error: unknown) {
    console.error('[API_WHATIF_ERROR]', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: `Invalid input: ${error.issues[0]?.message}`, status: 400 },
        { status: 400 }
      );
    }

    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('429')) {
      return NextResponse.json(
        { error: 'API limit reached. Please wait 60 seconds.', status: 429, retryAfter: 60 },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Unable to analyze playoff scenario. Please try again.', status: 500 },
      { status: 500 }
    );
  }
}
