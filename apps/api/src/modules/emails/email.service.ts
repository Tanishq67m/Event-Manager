import { Resend } from "resend";
import { env } from "../../config/env";

const resend = new Resend(env.RESEND_API_KEY || "re_dummy_key_to_prevent_startup_crash");

interface TicketEmailData {
  to: string;
  attendeeName: string;
  eventTitle: string;
  eventVenue: string;
  eventDate: string;
  ticketTypeName: string;
  quantity: number;
  totalAmount: number; // paise
  qrCode: string;
  bookingId: string;
}

interface OrganizerNotificationData {
  to: string;
  organizerName: string;
  eventTitle: string;
  attendeeName: string;
  ticketTypeName: string;
  quantity: number;
  totalAmount: number;
}

// ── QR Ticket Confirmation ────────────────────────────────────────────────────

export async function sendTicketConfirmation(data: TicketEmailData) {
  const amountInRupees = (data.totalAmount / 100).toFixed(2);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qrCode)}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1A56A4;padding:32px;text-align:center;">
            <p style="margin:0;color:#E6F1FB;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">EventPulse</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:600;">You're in! 🎉</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 24px;color:#444;font-size:15px;">Hi ${data.attendeeName},</p>
            <p style="margin:0 0 24px;color:#444;font-size:15px;">
              Your booking for <strong>${data.eventTitle}</strong> is confirmed. Show the QR code below at entry.
            </p>
            <!-- Event details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;margin-bottom:28px;">
              <tr><td style="padding:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;color:#888;font-size:13px;width:120px;">Event</td>
                    <td style="padding:6px 0;color:#222;font-size:13px;font-weight:600;">${data.eventTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#888;font-size:13px;">Venue</td>
                    <td style="padding:6px 0;color:#222;font-size:13px;">${data.eventVenue}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#888;font-size:13px;">Date</td>
                    <td style="padding:6px 0;color:#222;font-size:13px;">${data.eventDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#888;font-size:13px;">Ticket</td>
                    <td style="padding:6px 0;color:#222;font-size:13px;">${data.ticketTypeName} × ${data.quantity}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#888;font-size:13px;">Amount Paid</td>
                    <td style="padding:6px 0;color:#1A56A4;font-size:13px;font-weight:600;">₹${amountInRupees}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <!-- QR Code -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <p style="margin:0 0 12px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Your Entry QR Code</p>
                <img src="${qrImageUrl}" width="180" height="180" alt="QR Code" style="display:block;border:1px solid #eee;border-radius:8px;padding:8px;" />
                <p style="margin:12px 0 0;color:#1A56A4;font-size:13px;font-weight:600;font-family:monospace;letter-spacing:0.05em;">${data.qrCode}</p>
              </td></tr>
            </table>
            <p style="margin:0;color:#888;font-size:13px;text-align:center;">
              Booking ID: <span style="font-family:monospace;">${data.bookingId}</span>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;padding:20px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#aaa;font-size:12px;">EventPulse · eventpulse.in</p>
            <p style="margin:4px 0 0;color:#aaa;font-size:11px;">If you didn't make this booking, please contact support.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: data.to,
      subject: `Your ticket for ${data.eventTitle} — ${data.qrCode}`,
      html,
    });
  } catch (err) {
    // Don't throw — booking is confirmed, email failure is non-fatal
    console.error("Failed to send ticket confirmation email:", err);
  }
}

// ── Organizer new booking notification ────────────────────────────────────────

export async function sendOrganizerNotification(data: OrganizerNotificationData) {
  const amountInRupees = (data.totalAmount / 100).toFixed(2);

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:40px 20px;">
  <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;padding:32px;margin:0 auto;">
    <tr><td>
      <p style="color:#1A56A4;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">New Booking</p>
      <h2 style="margin:0 0 24px;color:#111;font-size:20px;">New registration for <em>${data.eventTitle}</em></h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;padding:20px;margin-bottom:20px;">
        <tr><td style="color:#888;font-size:13px;padding:5px 0;width:120px;">Attendee</td><td style="color:#222;font-size:13px;">${data.attendeeName}</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:5px 0;">Ticket</td><td style="color:#222;font-size:13px;">${data.ticketTypeName} × ${data.quantity}</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:5px 0;">Revenue</td><td style="color:#1A56A4;font-size:13px;font-weight:600;">₹${amountInRupees}</td></tr>
      </table>
      <p style="color:#aaa;font-size:12px;margin:0;">EventPulse organizer notification</p>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: data.to,
      subject: `New booking: ${data.attendeeName} registered for ${data.eventTitle}`,
      html,
    });
  } catch (err) {
    console.error("Failed to send organizer notification:", err);
  }
}

// ── 24h Event reminder ────────────────────────────────────────────────────────

export async function sendEventReminder(data: {
  to: string;
  attendeeName: string;
  eventTitle: string;
  eventVenue: string;
  eventDate: string;
  qrCode: string;
}) {
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.qrCode)}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:40px 20px;">
  <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;padding:32px;margin:0 auto;">
    <tr><td>
      <p style="color:#1A56A4;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">EventPulse Reminder</p>
      <h2 style="margin:0 0 8px;color:#111;font-size:20px;">Your event is tomorrow! ⏰</h2>
      <p style="color:#666;font-size:15px;margin:0 0 24px;">
        Hi ${data.attendeeName}, <strong>${data.eventTitle}</strong> is happening tomorrow.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;padding:20px;margin-bottom:24px;">
        <tr><td style="color:#888;font-size:13px;padding:5px 0;width:80px;">Venue</td><td style="color:#222;font-size:13px;">${data.eventVenue}</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:5px 0;">Date</td><td style="color:#222;font-size:13px;">${data.eventDate}</td></tr>
      </table>
      <p style="text-align:center;color:#888;font-size:12px;margin:0 0 12px;">Keep this QR ready at entry</p>
      <div style="text-align:center;">
        <img src="${qrImageUrl}" width="150" height="150" alt="QR" style="border:1px solid #eee;border-radius:8px;padding:6px;" />
        <p style="font-family:monospace;color:#1A56A4;font-size:13px;margin:8px 0 0;">${data.qrCode}</p>
      </div>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: data.to,
      subject: `Reminder: ${data.eventTitle} is tomorrow`,
      html,
    });
  } catch (err) {
    console.error("Failed to send event reminder:", err);
  }
}
