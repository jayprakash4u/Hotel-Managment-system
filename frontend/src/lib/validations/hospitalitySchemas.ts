import { z } from 'zod';

/**
 * Zod Validation Schemas for Hospitality Management System
 * Provides client and server validation for:
 * 1. Guest Registration & CRM
 * 2. Room Booking & Walk-in Check-in
 * 3. Hotel Room Setup & Pricing
 * 4. Folio Payment & Settlement
 */

// 1. Guest Registration Schema
export const guestSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens and apostrophes'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens and apostrophes'),
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address (e.g. guest@resort.com)'),
  phone: z
    .string()
    .min(7, 'Phone number must be at least 7 digits')
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Please enter a valid phone number with optional country code'),
  idNumber: z
    .string()
    .min(4, 'Government ID / Passport number is required (min 4 characters)')
    .max(30, 'ID number cannot exceed 30 characters'),
  country: z
    .string()
    .min(2, 'Country of residence is required'),
  vipTier: z
    .enum(['STANDARD', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'], {
      errorMap: () => ({ message: 'Please select a valid VIP loyalty tier' }),
    })
    .default('STANDARD'),
  preferences: z
    .string()
    .max(500, 'Special requests cannot exceed 500 characters')
    .optional(),
});

export type GuestFormValues = z.infer<typeof guestSchema>;

// 2. Reservation & Walk-In Check-In Schema
export const reservationSchema = z
  .object({
    guest: guestSchema,
    roomId: z
      .string()
      .min(1, 'Please select an available room from the matrix'),
    roomNumber: z
      .string()
      .min(1, 'Room number is required'),
    checkIn: z
      .string()
      .min(1, 'Check-in date is required'),
    checkOut: z
      .string()
      .min(1, 'Check-out date is required'),
    adults: z
      .number({ invalid_type_error: 'Number of adults must be a number' })
      .min(1, 'At least 1 adult guest is required')
      .max(10, 'Maximum 10 adult guests allowed per suite'),
    children: z
      .number()
      .min(0, 'Children cannot be negative')
      .max(6, 'Maximum 6 children allowed per suite')
      .default(0),
    ratePerNight: z
      .number({ invalid_type_error: 'Tariff must be a number' })
      .positive('Nightly tariff must be greater than $0'),
    depositAmount: z
      .number()
      .min(0, 'Deposit cannot be negative')
      .default(0),
    paymentMethod: z
      .enum(['CREDIT_CARD', 'CASH', 'WIRE_TRANSFER', 'ROOM_CHARGE'], {
        errorMap: () => ({ message: 'Please select a valid payment method' }),
      })
      .default('CREDIT_CARD'),
    paymentStatus: z
      .enum(['PAID', 'PARTIAL', 'UNPAID'])
      .default('UNPAID'),
    notes: z
      .string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.checkIn || !data.checkOut) return true;
      const inDate = new Date(data.checkIn);
      const outDate = new Date(data.checkOut);
      return outDate > inDate;
    },
    {
      message: 'Check-out date must be strictly after the check-in date',
      path: ['checkOut'],
    }
  );

export type ReservationFormValues = z.infer<typeof reservationSchema>;

// 3. Room Management & Setup Schema
export const roomSetupSchema = z.object({
  number: z
    .string()
    .min(1, 'Room number is required (e.g. 101, PH-1)')
    .max(10, 'Room number cannot exceed 10 characters'),
  floor: z
    .number({ invalid_type_error: 'Floor must be a number' })
    .int('Floor must be an integer')
    .min(0, 'Floor number must be 0 (Ground) or higher')
    .max(100, 'Floor cannot exceed 100'),
  type: z
    .string()
    .min(3, 'Room category is required (min 3 characters)'),
  bedType: z
    .enum(['KING', 'QUEEN', 'TWIN', 'DOUBLE', 'SUITE'], {
      errorMap: () => ({ message: 'Please select a standard bed configuration' }),
    }),
  capacity: z
    .number({ invalid_type_error: 'Capacity must be a number' })
    .int()
    .min(1, 'Capacity must be at least 1 person')
    .max(12, 'Capacity cannot exceed 12 persons'),
  pricePerNight: z
    .number({ invalid_type_error: 'Nightly tariff must be a number' })
    .positive('Nightly tariff must be greater than $0'),
  status: z
    .enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'DIRTY', 'OUT_OF_ORDER', 'MAINTENANCE'])
    .default('AVAILABLE'),
  amenities: z
    .array(z.string())
    .min(1, 'Please select at least one standard room amenity'),
  hasBalcony: z.boolean().default(false),
  hasSeaView: z.boolean().default(false),
});

export type RoomSetupFormValues = z.infer<typeof roomSetupSchema>;
