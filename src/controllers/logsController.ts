import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendMessage } from '../kafka/procedure';
import moment from 'moment';

const prisma = new PrismaClient();

export const getLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;

    const logs = await prisma.logs.findMany({
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalLogs = await prisma.logs.count();

    res.json({
      data: logs,
      pagination: {
        total: totalLogs,
        perPage,
        currentPage: page,
        totalPages: Math.ceil(totalLogs / perPage),
      },
    });
  } catch (error) {
    next('Error fetching logs');
  }
};