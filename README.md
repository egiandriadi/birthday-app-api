
# Express.js Kafka Application

This application is built using Express.js, Kafka, PostgreSQL, and Prisma. It includes a cron job to perform scheduled tasks and uses Kafka for message queuing.

Purpose of this application to sending a thousand birthday message today using cronjobs and queueing.

## Authors

- [@egiandriadi](https://www.github.com/egiandriadi)

## Tech Stack

**Backend:** Express.js: Web framework for Node.js

**Queue:** Kafka

**Database:** Postgre SQL

**ORM:** Prisma

## Installation

**Setup Kafka**

If you don't have Kafka set up, you can create a Kafka instance using Docker.

***Create Kafka Using Docker***

- Create a directory for Kafka:

```bash
mkdir kafka-docker
cd kafka-docker
mkdir kafka_data
sudo chown -R 1000:1000 kafka_data
sudo chmod -R 755 kafka_data
```

- Create a ***docker-compose.yml*** file with the following content:

```code
version: '3.3'

services:
  zookeeper:
    image: 'confluentinc/cp-zookeeper:latest'
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - '2181:2181'

  kafka:
    image: 'confluentinc/cp-kafka:latest'
    depends_on:
      - zookeeper
    ports:
      - '9092:9092'
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://127.0.0.1:9092 # Change this if you want access from a public IP
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    volumes:
      - /home/markit/kafka-docker/kafka_data:/var/lib/kafka/data

  cmak:
    image: 'hlebalbau/kafka-manager:latest'
    ports:
      - '9000:9000'
    environment:
      ZK_HOSTS: zookeeper:2181
    depends_on:
      - zookeeper
      - kafka

volumes:
  kafka_data:
```

- Start the Kafka services:

```bash
docker-compose up -d
```

- Access CMAK at <http://127.0.0.1:9000/> if set up locally, or use the server's IP address.

**Set Up Kafka Cluster and Create a Topic**

Set up your Kafka cluster and create a topic called ***birthday_topic***.

**Create a Database in PostgreSQL**

Set up a PostgreSQL database for the application, and create a database.

**Pull the Code from the Repository and Set Up .env**

Create a ***.env*** file with the following content:

``` code
DATABASE_URL="postgresql://[username]:[password]@[host]:5432/[databasename]?schema=public"

CRON_BIRTHDAY=30 9 * * *  # This runs the job at 9:30 AM every day

# Default Kafka configuration if you do not have one
KAFKA_CLIENT_ID=MyKafkaCluster
KAFKA_BROKERS=103.150.196.53:9092
KAFKA_SSL=false
KAFKA_SASL_MECHANISM=plain
KAFKA_SASL_USERNAME=superappscrm
KAFKA_SASL_PASSWORD=Welcomejanur
```

**Install Dependencies**

Run the following command to install the necessary dependencies:

``` bash
npm install
```

Ensure you are using the latest version of Node.js.

**Set Up Prisma**

Run the following command to migrate the database schema:

``` bash
npx prisma migrate dev
```

**Seed the Database (Optional)**

If you need fake sample data, run the following command:

``` bash
npx ts-node prisma/seed.ts
```

**Start the Application**

Run the application using

``` bash
npm run dev
```

This will start the Express.js server and execute the cron job as scheduled.

## API Reference

You can see the all api reference under swagger

<http://localhost:3000/api-docs/>

## 🚀 About Me

Experienced Full Stack Developer | 14+ Years | PHP, Node.js, C#, Angular, Vue.js, Next JS, Golang | API Expert | Team Lead | Innovating Digital Solutions | Eager to learn | Let's connect!

If you have any question please contact me at:

Whatsapp: +6281319308883

Email:  <egi.andriadi@gmail.com>
