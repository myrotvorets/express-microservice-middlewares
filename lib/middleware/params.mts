import type { NextFunction, Request, Response } from 'express';

export function numberParamHandler(
    req: Request<Record<string, unknown>>,
    _res: Response,
    next: NextFunction,
    value: string,
    name: string,
): void {
    req.params[name] = +value;
    next();
}
