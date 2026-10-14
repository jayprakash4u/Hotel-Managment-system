import { NextRequest, NextResponse } from 'next/server';
import { reservationSchema } from '@/lib/validations/hospitalitySchemas';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Server-side Zod Schema Validation
    const parsed = reservationSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        const path = err.path.join('.');
        fieldErrors[path] = err.message;
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Server validation failed: One or more fields are invalid.',
          fieldErrors,
        },
        { status: 422 }
      );
    }

    const data = parsed.data;

    // 2. Server Domain Logic Simulation (Simulate conflict check or VIP rules)
    if (data.guest.email.toLowerCase().includes('blacklisted')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Server security check: This guest email is flagged on the security blacklist.',
          fieldErrors: {
            'guest.email': 'Guest account is flagged in property security database.',
          },
        },
        { status: 422 }
      );
    }

    // Simulate network delay for real-world loading state demonstration
    await new Promise((res) => setTimeout(res, 800));

    const bookingCode = `RES-${Math.floor(100000 + Math.random() * 900000)}`;

    return NextResponse.json({
      success: true,
      bookingCode,
      message: `Reservation ${bookingCode} confirmed! Room ${data.roomNumber} assigned to ${data.guest.firstName} ${data.guest.lastName}.`,
      data: {
        bookingCode,
        ...data,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error while processing booking.',
      },
      { status: 500 }
    );
  }
}
