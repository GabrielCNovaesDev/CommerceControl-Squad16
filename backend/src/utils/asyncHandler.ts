import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Envolve um handler async e encaminha qualquer erro para next(err),
 * eliminando try/catch repetitivo nos controllers.
 */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncHandler;
