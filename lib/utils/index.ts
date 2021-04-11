// eslint-disable-next-line import/no-unresolved
import type { IRouter, ParamsDictionary, PathParams, Query, RequestHandler } from 'express-serve-static-core';
import type { ErrorResponse } from '../middleware/types';

export function badGatewayFromError(err: Error): ErrorResponse {
    return {
        success: false,
        status: 502,
        code: 'BAD_GATEWAY',
        message: err.message,
    };
}

function attach<P, ResBody, ReqBody, ReqQuery>(
    what: IRouter,
    path: PathParams,
    method: 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'use',
    handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery>>,
): void {
    handlers.forEach((handler) => what[method](path, handler));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function use<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = Query>(
    what: IRouter,
    path: PathParams,
    ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery>>
): void {
    attach(what, path, 'use', handlers);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function all<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = Query>(
    what: IRouter,
    path: PathParams,
    ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery>>
): void {
    attach(what, path, 'all', handlers);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function get<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = Query>(
    what: IRouter,
    path: PathParams,
    ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery>>
): void {
    attach(what, path, 'get', handlers);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function post<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = Query>(
    what: IRouter,
    path: PathParams,
    ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery>>
): void {
    attach(what, path, 'post', handlers);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function put<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = Query>(
    what: IRouter,
    path: PathParams,
    ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery>>
): void {
    attach(what, path, 'put', handlers);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function del<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = Query>(
    what: IRouter,
    path: PathParams,
    ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery>>
): void {
    attach(what, path, 'delete', handlers);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function patch<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = Query>(
    what: IRouter,
    path: PathParams,
    ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery>>
): void {
    attach(what, path, 'patch', handlers);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function options<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = Query>(
    what: IRouter,
    path: PathParams,
    ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery>>
): void {
    attach(what, path, 'options', handlers);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function head<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = Query>(
    what: IRouter,
    path: PathParams,
    ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery>>
): void {
    attach(what, path, 'head', handlers);
}
