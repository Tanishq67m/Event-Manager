/// <reference path="../../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import * as checkinService from "./checkin.service";
import { sendSuccess } from "../../utils/response";

export async function scanQrHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { qrCode } = req.body;
    if (!qrCode || typeof qrCode !== "string") {
      res.status(400).json({ success: false, error: "qrCode is required" });
      return;
    }
    const result = await checkinService.scanQrCode(req.user!.userId, qrCode.trim().toUpperCase());
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getAnalyticsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const analytics = await checkinService.getEventAnalytics(
      req.user!.userId,
      req.params.eventId as string
    );
    sendSuccess(res, analytics);
  } catch (err) {
    next(err);
  }
}

export async function exportAttendeesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const attendees = await checkinService.getAttendeeList(
      req.user!.userId,
      req.params.eventId as string
    );

    // Build CSV
    if (attendees.length === 0) {
      res.status(200).json({ success: true, data: [], message: "No confirmed attendees yet" });
      return;
    }

    const headers = Object.keys(attendees[0]);
    const csvRows = [
      headers.join(","),
      ...attendees.map((row) =>
        headers
          .map((h) => {
            const val = String((row as Record<string, unknown>)[h] ?? "");
            // Escape commas and quotes in values
            return val.includes(",") || val.includes('"')
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          })
          .join(",")
      ),
    ];

    const csv = csvRows.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendees-${req.params.eventId}.csv"`
    );
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}
