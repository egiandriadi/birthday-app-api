import { Kafka, logLevel } from 'kafkajs';

const brokers = ['103.150.196.53:9092'];//process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : [];
console.log('Broker', brokers);
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'default-client-id', // Provide a default client ID if needed
  brokers: brokers,
  // ssl: process.env.KAFKA_SSL === 'true',
  // sasl: {
  //   mechanism: 'plain', 
  //   username: process.env.KAFKA_SASL_USERNAME || 'superappscrm',
  //   password: process.env.KAFKA_SASL_PASSWORD || 'Welcomejanur',
  // },
  // logLevel: logLevel.DEBUG, // Enable detailed logging
});

const producer = kafka.producer();

export const sendMessage = async (data: any) => {
  try {
    const jsonString = JSON.stringify(data, null, 2);

    await producer.connect();
    await producer.send({
      topic: 'birthday_topic',
      messages: [{ value: jsonString }],
    });
    await producer.disconnect();
  } catch (error) {
    console.error('Error in Kafka producer:', error);
  }
};