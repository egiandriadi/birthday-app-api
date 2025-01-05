import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import moment from 'moment';

const prisma = new PrismaClient();

async function main() {
  const users = Array.from({ length: 1000 }, () => {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`;

    return {
      firstName,
      lastName,
      email,
      birthday: faker.date.between({ from: '1970-01-01', to: '2000-12-31' }),
      location: faker.address.city(),
    };
  });

  await prisma.users.createMany({ data: users });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });