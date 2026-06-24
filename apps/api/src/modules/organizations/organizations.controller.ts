import { Request, Response, NextFunction } from "express";
import * as orgService from "./organizations.service";
import { sendSuccess } from "../../utils/response";

export async function createOrgHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await orgService.createOrganization(req.user!.userId, req.body);
    sendSuccess(res, org, "Organization created", 201);
  } catch (err) { next(err); }
}

export async function getMyOrgHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await orgService.getMyOrganization(req.user!.userId);
    sendSuccess(res, org);
  } catch (err) { next(err); }
}

export async function getOrgBySlugHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await orgService.getOrganizationBySlug(req.params.slug as string);
    sendSuccess(res, org);
  } catch (err) { next(err); }
}

export async function updateOrgHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await orgService.updateOrganization(req.user!.userId, req.body);
    sendSuccess(res, org, "Organization updated");
  } catch (err) { next(err); }
}
