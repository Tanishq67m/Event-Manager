import { Request, Response, NextFunction } from "express";
import * as eventService from "./events.service";
import { listEventsSchema } from "./events.schema";
import { sendSuccess, sendPaginated } from "../../utils/response";

// ── Public ────────────────────────────────────────────────────────────────────

export async function listEventsHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const query = listEventsSchema.parse(req.query);
        const result = await eventService.listPublishedEvents(query);
        sendPaginated(res, result.events, result.total, result.page, result.limit);
    } catch (err) { next(err); }
}

export async function getPublicEventHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const event = await eventService.getPublicEventBySlug(req.params.slug as string);
        sendSuccess(res, event);
    } catch (err) { next(err); }
}

// ── Organizer ─────────────────────────────────────────────────────────────────

export async function createEventHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const event = await eventService.createEvent(req.user!.userId, req.body);
        sendSuccess(res, event, "Event created", 201);
    } catch (err) { next(err); }
}

export async function getOrganizerEventsHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const events = await eventService.getOrganizerEvents(req.user!.userId);
        sendSuccess(res, events);
    } catch (err) { next(err); }
}

export async function getOrganizerEventByIdHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const event = await eventService.getOrganizerEventById(req.user!.userId, req.params.id as string);
        sendSuccess(res, event);
    } catch (err) { next(err); }
}

export async function updateEventHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const event = await eventService.updateEvent(req.user!.userId, req.params.id as string, req.body);
        sendSuccess(res, event, "Event updated");
    } catch (err) { next(err); }
}

export async function publishEventHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const event = await eventService.publishEvent(req.user!.userId, req.params.id as string);
        sendSuccess(res, event, "Event published");
    } catch (err) { next(err); }
}

export async function deleteEventHandler(req: Request, res: Response, next: NextFunction) {
    try {
        await eventService.deleteEvent(req.user!.userId, req.params.id as string);
        sendSuccess(res, null, "Event deleted");
    } catch (err) { next(err); }
}
