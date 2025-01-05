import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import moment from 'moment';
import { sendMessage } from '../kafka/procedure';

const prisma = new PrismaClient();

const cron_schedule = process.env.CRON_BIRTHDAY;

if (!cron_schedule) {
  console.error('CRON_BIRTHDAY is not defined in the .env file');
  process.exit(1);
}

const job = cron.schedule(cron_schedule, async () => {
  try {
    console.log(`Cron job running at ${cron_schedule} every day`);
    const today = moment();
        const todayMonth = today.month() + 1; // moment.js months are 0-indexed, so add 1
        const todayDate = today.date();
    
    const users = await prisma.$queryRaw<any[]>`
        SELECT *, EXTRACT(YEAR FROM AGE("birthday")) AS age FROM "users"
        WHERE EXTRACT(MONTH FROM "birthday") = ${todayMonth}
        AND EXTRACT(DAY FROM "birthday") = ${todayDate}
        AND (DATE(emailBirthdaySentAt) < ${today.toDate()}::date OR emailBirthdaySentAt IS NULL)
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
  } catch (error) {
    console.error('Error executing cron job:', error);
  }
});

export const startCronJob = () => {
  job.start();
};