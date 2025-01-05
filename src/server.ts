import express, { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
import userRouter from './routes/user';
import logsRouter from './routes/logs';
import { setupSwagger } from './swagger';
import { consumeMessages } from './kafka/consumer';
import cors from 'cors';
import { startCronJob } from './cron/birthdayCron';

const app = express();

app.use(cors());

app.use(json());

app.use('/user', userRouter);
app.use('/logs', logsRouter);

// Error-handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});


setupSwagger(app); // Set up Swagger

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Start the cron job
startCronJob();

// Start consuming messages
consumeMessages().catch(console.error);

