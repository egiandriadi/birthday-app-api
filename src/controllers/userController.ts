import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendMessage } from '../kafka/procedure';
import moment from 'moment';

const prisma = new PrismaClient();

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, birthday, location, createdBy } = req.body;
    
    const parsedBirthday = new Date(birthday);

    const user = await prisma.users.create({
      data: {
        firstName,
        lastName,
        email,
        birthday: parsedBirthday,
        location,
        createdBy, // Optional field, can be set to null or a default value if not provided
      },
    });
    res.status(201).json(user);
  } catch (error) {
    next('Error creating user');
  }
};


export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const userId = parseInt(id, 10);
    if (isNaN(userId) || userId <= 0) {
      res.status(400).json({ error: 'Invalid ID supplied' });
    }

    // Check if the user exists
    const userCheck = await prisma.users.findUnique({
      where: { id: Number(id) },
    });

    if (!userCheck) {
      res.status(404).json({ error: 'User not found' });
    }

    const { firstName, lastName, email, birthday, location, updatedBy } = req.body;
    
    const data: any = {};

    const parsedBirthday = new Date(birthday);
    // Conditionally add fields to the data object
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (email !== undefined) data.email = email;
    if (birthday !== undefined) {
      data.birthday = parsedBirthday;
    }
    if (location !== undefined) data.location = location;
    if (updatedBy !== undefined) data.updatedBy = updatedBy;

    // Update the user
    const updatedUser = await prisma.users.update({
      where: { id: Number(id) },
      data
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    next('Error creating user');
  }
};


export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Validate the ID
    const userId = parseInt(id, 10);
    if (isNaN(userId) || userId <= 0) {
      res.status(400).json({ error: 'Invalid ID supplied' });
    }

    // Check if the user exists
    const user = await prisma.users.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
    }

    await prisma.users.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    next('Error deleting user');
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;

    const users = await prisma.users.findMany({
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalUsers = await prisma.users.count();

    res.json({
      data: users,
      pagination: {
        total: totalUsers,
        perPage,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / perPage),
      },
    });
  } catch (error) {
    next('Error fetching users');
  }
};

export const sendBirthdayMessages = async (req: Request, res: Response) => {
  try {
    const today = moment();
    const todayMonth = today.month() + 1; // moment.js months are 0-indexed, so add 1
    const todayDate = today.date();

    const page = parseInt(req.query.page as string, 10) || 1;
    const perPage = parseInt(req.query.perPage as string, 10) || 10;
    const offset = (page - 1) * perPage;

    // console.log(`Current date and time in`, today.format("YYYY-MM-DD"));

    // Use a raw SQL query to filter by day and month
    const users = await prisma.$queryRaw<any[]>`
      SELECT *, EXTRACT(YEAR FROM AGE("birthday")) AS age FROM "users"
      WHERE EXTRACT(MONTH FROM "birthday") = ${todayMonth}
      AND EXTRACT(DAY FROM "birthday") = ${todayDate}
      AND (DATE(emailBirthdaySentAt) < ${today.toDate()}::date OR emailBirthdaySentAt IS NULL)
      LIMIT ${perPage} OFFSET ${offset}
    `;

    const totalUsers = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) FROM "users"
      WHERE EXTRACT(MONTH FROM "birthday") = ${todayMonth}
      AND EXTRACT(DAY FROM "birthday") = ${todayDate}
      AND (DATE(emailBirthdaySentAt) < ${today.toDate()}::date OR emailBirthdaySentAt IS NULL)
    `;

    for (const user of users) {
      const message = {
        ...user,
        message: `Hi, ${user.firstName} ${user.lastName}, Happy birthday ${user.age} to you... Wish you all the best.`
      };
      await sendMessage(message);
    }

    const totalCount = Number(totalUsers[0].count);
    console.log(`Get ${totalCount} of Birthday ${today.toDate()}`);

    
    res.json({
      data: users,
      pagination: {
        total: totalCount,
        perPage,
        currentPage: page,
        totalPages: Math.ceil(totalCount / perPage),
      },
    });
  } catch (error) {
    console.error('Error sending birthday messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};