import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'CommerceControl API running',
    version: '1.0.0',
  });
}