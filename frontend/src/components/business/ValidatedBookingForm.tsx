'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  Calendar,
  CreditCard,
  BedDouble,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Send,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  reservationSchema,
  ReservationFormValues,
} from '@/lib/validations/hospitalitySchemas';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  FormErrorAlert,
  FormSuccessAlert,
  FormSubmitButton,
  Button,
  Input,
  Select,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  useToast,
} from '@/components/ui';

export function ValidatedBookingForm() {
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const defaultValues: ReservationFormValues = {
    guest: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      idNumber: '',
      country: 'United States',
      vipTier: 'STANDARD',
      preferences: '',
    },
    roomId: 'room_101',
    roomNumber: '101',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    adults: 2,
    children: 0,
    ratePerNight: 280,
    depositAmount: 100,
    paymentMethod: 'CREDIT_CARD',
    paymentStatus: 'PARTIAL',
    notes: '',
  };

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues,
    mode: 'onTouched', // Real-time client validation after touched
  });

  const {
    handleSubmit,
    setValue,
    reset,
    setError,
    formState: { isSubmitting, errors },
  } = form;

  // Form Submission (Client + Server Validation)
  const onSubmit = async (data: ReservationFormValues) => {
    setServerError(null);
    setServerSuccess(null);

    try {
      const response = await fetch('/api/reservations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Handle Server-Side Validation Errors (HTTP 422)
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, msg]) => {
            setError(field as any, {
              type: 'server',
              message: String(msg),
            });
          });
        }
        setServerError(result.message || 'Server rejected the booking submission.');
        toast.error('Booking Rejected', result.message || 'Please correct the highlighted errors.');
        return;
      }

      // Handle Server-Side Success
      setServerSuccess(result.message);
      toast.celebrate('Booking Confirmed!', result.message);
    } catch (err: any) {
      setServerError(err.message || 'Network communication failure with hotel PMS backend.');
      toast.error('Submission Failed', err.message);
    }
  };

  // Helper Preset 1: Auto-fill Valid Guest Data
  const handlePrefillValid = () => {
    setServerError(null);
    setServerSuccess(null);
    reset({
      guest: {
        firstName: 'Eleanor',
        lastName: 'Vance',
        email: 'eleanor.vance@resortguest.com',
        phone: '+1 (555) 392-8812',
        idNumber: 'P98231024',
        country: 'United Kingdom',
        vipTier: 'GOLD',
        preferences: 'High floor, feather pillows, chilled sparkling water on arrival.',
      },
      roomId: 'room_501',
      roomNumber: '501',
      checkIn: '2026-11-01',
      checkOut: '2026-11-06',
      adults: 2,
      children: 1,
      ratePerNight: 420,
      depositAmount: 420,
      paymentMethod: 'CREDIT_CARD',
      paymentStatus: 'PAID',
      notes: 'Anniversary celebration stay.',
    });
    toast.success('Form Populated', 'Valid booking values ready for submission.');
  };

  // Helper Preset 2: Auto-fill Invalid Data to test Client-Side Zod Validation
  const handlePrefillInvalid = () => {
    setServerError(null);
    setServerSuccess(null);
    reset({
      guest: {
        firstName: '1', // Too short, invalid regex
        lastName: '', // Required
        email: 'not-an-email', // Invalid email
        phone: '12', // Too short
        idNumber: 'x', // Too short
        country: '',
        vipTier: 'STANDARD',
        preferences: '',
      },
      roomId: '',
      roomNumber: '',
      checkIn: '2026-12-10',
      checkOut: '2026-12-05', // Check-out before check-in!
      adults: 0, // Min 1
      children: -1, // Cannot be negative
      ratePerNight: -50, // Must be positive
      depositAmount: -10,
      paymentMethod: 'CREDIT_CARD',
      paymentStatus: 'UNPAID',
      notes: '',
    });
    // Trigger validation immediately to show errors
    form.trigger();
    toast.error('Loaded Invalid Sample', 'Testing client-side Zod validation rules.');
  };

  // Helper Preset 3: Test Server-Side Rejection
  const handlePrefillBlacklist = () => {
    handlePrefillValid();
    setValue('guest.email', 'blacklisted.guest@fraud-sample.com');
    toast.warning('Server Test Ready', 'Guest email set to trigger server-side blacklist rejection.');
  };

  return (
    <Card className="max-w-4xl mx-auto shadow-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">
              Enterprise Reservation & Check-In Form
            </CardTitle>
            <CardDescription className="mt-1">
              Demonstrates <strong>React Hook Form</strong>, <strong>Zod Validation</strong>, client rules, server responses, error alerts, and loading states.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePrefillValid}
              leftIcon={<Zap className="w-3.5 h-3.5 text-[#0B3D32]" />}
            >
              Fill Valid
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrefillInvalid}
              leftIcon={<AlertCircle className="w-3.5 h-3.5 text-[#B42332]" />}
            >
              Test Invalid
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrefillBlacklist}
              className="text-xs"
            >
              Test Server 422
            </Button>
          </div>
        </div>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Top Level Server Error / Success Alerts */}
            {serverError && (
              <FormErrorAlert
                title="Server Validation Rejection (HTTP 422)"
                message={serverError}
              />
            )}

            {serverSuccess && (
              <FormSuccessAlert
                title="Booking Confirmed by Hotel PMS"
                message={serverSuccess}
              />
            )}

            {/* SECTION A: GUEST INFORMATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E4E9E5] dark:border-[#145447]/60">
                <User className="w-4 h-4 text-[#0B3D32] dark:text-[#4ADE80]" />
                <h4 className="font-heading font-bold text-sm text-[#24352F] dark:text-white">
                  1. Guest Identification & Contact (Client Validated)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="guest.firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel requiredIndicator>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Eleanor"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guest.lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel requiredIndicator>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Vance"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="guest.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel requiredIndicator>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="guest@domain.com"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Confirmation folio will be dispatched to this address.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guest.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel requiredIndicator>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+1 (555) 000-0000"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="guest.idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel requiredIndicator>Passport / National ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. P12345678"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guest.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel requiredIndicator>Country of Residence</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. United Kingdom"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guest.vipTier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VIP Loyalty Tier</FormLabel>
                      <FormControl>
                        <Select
                          disabled={isSubmitting}
                          options={[
                            { value: 'STANDARD', label: 'Standard Guest (0%)' },
                            { value: 'SILVER', label: 'Silver VIP (5% Discount)' },
                            { value: 'GOLD', label: 'Gold VIP (10% Discount)' },
                            { value: 'PLATINUM', label: 'Platinum VIP (15% Discount)' },
                            { value: 'DIAMOND', label: 'Diamond Royal (20% Discount)' },
                          ]}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECTION B: STAY DATES & OCCUPANCY */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E4E9E5] dark:border-[#145447]/60">
                <Calendar className="w-4 h-4 text-[#0B3D32] dark:text-[#4ADE80]" />
                <h4 className="font-heading font-bold text-sm text-[#24352F] dark:text-white">
                  2. Stay Dates & Room Selection (Refined Range Rule)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="checkIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel requiredIndicator>Check-In Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checkOut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel requiredIndicator>Check-Out Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Zod refine constraint: Must be strictly after check-in date.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel requiredIndicator>Room Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 501"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adults"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel requiredIndicator>Adults (1-10)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={isSubmitting}
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ratePerNight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel requiredIndicator>Nightly Tariff ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={isSubmitting}
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="depositAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit Paid ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={isSubmitting}
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="guest.preferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Concierge & Housekeeping Special Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Dietary requirements, early check-in notes, champagne setup..."
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#64736C]">
              <Sparkles className="w-4 h-4 text-[#0B3D32]" />
              <span>Inputs dynamically validate with typed Zod schema.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => reset(defaultValues)}
                disabled={isSubmitting}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset
              </Button>

              <FormSubmitButton
                loadingLabel="Validating with PMS Server..."
                leftIcon={<Send className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Submit Reservation (Validated)
              </FormSubmitButton>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
