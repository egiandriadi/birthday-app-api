import { Kafka } from 'kafkajs';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const kafka = new Kafka({
  clientId: 'birthday-app',
  brokers: ['103.150.196.53:9092'],
  // sasl: {
  //   mechanism: 'plain',
  //   username: 'superappscrm',
  //   password: 'Welcomejanur',
  // },
});

const consumer = kafka.consumer({ groupId: 'birthday-group' });

export const consumeMessages = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'birthday_topic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const dataMessage = message.value?.toString();
      const dataObject = JSON.parse(dataMessage || '');
      try {
        let status = 500;
        let retries = 0;

        try {
          status = await sendEmail(dataObject.message, dataObject.email);
          retries = status === 200 ? retries : 5; // Assume max retries if not successful
        } finally {
          // await producer.send({
          //   topic: 'birthday_topic',
          //   messages: [{ value: JSON.stringify({ email, message, status }) }],
          // });
          if(status === 200){
            await prisma.users.update({
              where: { id: dataObject.id },
              data: { emailBirthdaySentAt: new Date() },
            });
            console.log(`Email sent successfully: ${status}`);
          }
          await prisma.logs.create({
            data: {
              email: dataObject.email,
              message: dataObject.message,
              status,
              retries,
            },
          });
        }
        // const response = await axios.post('https://email-service.digitalenvision.com.au/send-email', {
        //   email: `${dataObject.email}`,
        //   message: dataObject.message,
        // });

        
        
      } catch (error) {
        console.error('Error sending email:', error);
      }
    },
  });
};

async function sendEmail(message: string, email: string, retries = 0): Promise<number> {
  try {
    const response = await axios.post('https://email-service.digitalenvision.com.au/send-email', {
      email,
      message,
    });

    console.log(`Email to ${email} sent successfully with status ${response.status}`);
    // Log the message
    return response.status;
  } catch (error: any) {
    if (retries < 5) {
      console.warn(`Retrying ${email} (${retries + 1}/5)`);
      return sendEmail(message, email, retries + 1);
    }
    console.error(`Failed to send email to ${email} after 5 attempts`);
    throw error;
  }
}