import type { NextFunction, Request, Response } from 'express';

/* See https://github.com/CloudNativeJS/cloud-health-connect/issues/75 */
export function addJsonContentTypeMiddleware(req: Request, res: Response, next: NextFunction): void {
    res.type('application/json');
    next();
}
