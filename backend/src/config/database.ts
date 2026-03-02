import { Sequelize } from 'sequelize-typescript';
import chalk from 'chalk';
import dotenv from 'dotenv';
dotenv.config();

import * as Models from '../models';

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }, // Neon requiere SSL
  },
});

const modelList = Object.entries(Models)
  .filter(([key, val]) => key !== 'setupAssociations' && typeof val === 'function')
  .map(([_, val]) => val as any);

if (modelList.length) {
  sequelize.addModels(modelList);
  if (typeof (Models as any).setupAssociations === 'function') {
    (Models as any).setupAssociations();
  }
}

export const syncDb = async (opts: { force?: boolean } = {}) => {
  try {
    await sequelize.authenticate();
    console.log(chalk.green('Conexión a la base de datos exitosa'));
    
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log(chalk.blue('Base de datos sincronizada'));
    }
  } catch (err) {
    console.error('Error conectando a la DB:', err);
    throw err;
  }
};

export default sequelize;