import { Request, Response } from 'express';
import { HTTP_STATUS, ERROR_CODES } from '@rideflow/shared';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
  });
};
