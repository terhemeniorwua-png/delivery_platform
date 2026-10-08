'use strict';

const bcrypt = require('bcrypt');
const { User, Rider } = require('../src/models');

const DEMO_PASSWORD = 'Password123!';
const hash = () => bcrypt.hashSync(DEMO_PASSWORD, 10);

const USERS = [
  {
    firstName: 'Tunde',
    lastName: 'Adebayo',
    email: 'admin@clothing-delivery.test',
    phone: '+2348010000001',
    role: 'ADMIN',
    status: 'ACTIVE',
  },
  {
    firstName: 'Musa',
    lastName: 'Bello',
    email: 'musa.rider@clothing-delivery.test',
    phone: '+2348010000002',
    role: 'RIDER',
    status: 'ACTIVE',
  },
  {
    firstName: 'Kelechi',
    lastName: 'Okeke',
    email: 'kelechi.rider@clothing-delivery.test',
    phone: '+2348010000003',
    role: 'RIDER',
    status: 'ACTIVE',
  },
  {
    firstName: 'Ada',
    lastName: 'Obi',
    email: 'ada.customer@clothing-delivery.test',
    phone: '+2348020000001',
    role: 'CUSTOMER',
    status: 'ACTIVE',
  },
  {
    firstName: 'Chidi',
    lastName: 'Nwosu',
    email: 'chidi.customer@clothing-delivery.test',
    phone: '+2348020000002',
    role: 'CUSTOMER',
    status: 'ACTIVE',
  },
  {
    firstName: 'Aisha',
    lastName: 'Bello',
    email: 'aisha.customer@clothing-delivery.test',
    phone: '+2348020000003',
    role: 'CUSTOMER',
    status: 'ACTIVE',
  },
];

const RIDERS = [
  { email: 'musa.rider@clothing-delivery.test', vehicleType: 'MOTORCYCLE', vehicleNumber: 'LAG-482-XK', availability: 'AVAILABLE' },
  { email: 'kelechi.rider@clothing-delivery.test', vehicleType: 'BICYCLE', vehicleNumber: 'ABJ-119-UE', availability: 'OFFLINE' },
];

module.exports = {
  async up() {
    for (const seed of USERS) {
      const existing = await User.scope('withPassword').findOne({ where: { email: seed.email } });
      if (!existing) {
        await User.create({ ...seed, password: hash() });
      }
    }

    for (const seed of RIDERS) {
      const user = await User.scope('withPassword').findOne({ where: { email: seed.email } });
      if (!user) continue;
      const existing = await Rider.findOne({ where: { userId: user.id } });
      if (!existing) {
        await Rider.create({
          userId: user.id,
          vehicleType: seed.vehicleType,
          vehicleNumber: seed.vehicleNumber,
          availability: seed.availability,
        });
      }
    }
  },

  async down() {
    await Rider.destroy({ where: {} });
    await User.destroy({ where: {} });
  },
};
