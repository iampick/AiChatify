import { NextResponse } from 'next/server';

export function GET(req, res) {
  return NextResponse.json({ message: 'Hello API from GET' }, { status: 200 });
}

export function POST(req, res) {
  return NextResponse.json({ message: 'Hello API from POST' }, { status: 200 });
}

// Add additional methods as needed...
