import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }

    // Handle PostgreSQL errors
    if (err.name === 'error' && (err as any).code) {
        const pgError = err as any;
        if (pgError.code === '23505') { // Unique violation
            res.status(409).json({
                success: false,
                message: 'A record with this information already exists',
            });
            return;
        }
        if (pgError.code === '23503') { // Foreign key violation
            res.status(400).json({
                success: false,
                message: 'Invalid reference to related record',
            });
            return;
        }
    }

    // Default error
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
};

export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
};

