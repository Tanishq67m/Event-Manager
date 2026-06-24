import * as express from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

declare module "express" {
  interface Request {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}
