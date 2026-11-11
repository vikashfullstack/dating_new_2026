import dotenv from 'dotenv';
import { Sequelize, DataTypes, Op } from 'sequelize';

dotenv.config({ path: ['.env.local', '.env'], quiet: true });

const connectionOptions = {
  dialect: 'postgres' as const,
  logging: false as const,
  pool: { max: 10, min: 0, acquire: 10000 },
};

// Separate fields handle passwords containing URL-special characters directly.
// DB_* settings take precedence over DATABASE_URL when DB_HOST is provided.
export const sequelize = process.env.DB_HOST
  ? new Sequelize(
      process.env.DB_NAME || 'cipherdate',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || '',
      {
        ...connectionOptions,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
      },
    )
  : new Sequelize(
      process.env.DATABASE_URL || 'postgres://cipherdate:cipherdate@127.0.0.1:5432/cipherdate',
      connectionOptions,
    );

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, primaryKey: true },
  data: { type: DataTypes.JSONB, allowNull: false },
}, { tableName: 'users', schema: 'cipherdate' });
const Session = sequelize.define('Session', {
  token: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING, allowNull: false },
  expiresAt: { type: DataTypes.BIGINT, allowNull: false },
  data: { type: DataTypes.JSONB, allowNull: false },
}, { tableName: 'sessions', schema: 'cipherdate' });
const Message = sequelize.define('EncryptedMessage', {
  id: { type: DataTypes.STRING, primaryKey: true },
  data: { type: DataTypes.JSONB, allowNull: false },
}, { tableName: 'encrypted_messages', schema: 'cipherdate' });

export const serverUsers = {
  async list(): Promise<any[]> {
    return (await User.findAll()).map(row => row.get('data'));
  },
  async get(email: string): Promise<any> {
    return (await User.findByPk(email))?.get('data');
  },
  async set(email: string, data: any) {
    await User.upsert({ email, data });
  },
};
export const serverSessions = {
  async get(token: string): Promise<any> {
    const row = await Session.findByPk(token);
    if (!row) return null;
    const session = row.get('data') as any;
    const user = await User.findOne({ where: { data: { id: session.userId } } });
    return user ? { ...session, user: user.get('data') } : null;
  },
  async set(token: string, data: any) {
    await Session.upsert({ token, userId: data.userId, expiresAt: data.expiresAt, data });
  },
  async delete(token: string) { await Session.destroy({ where: { token } }); },
  async count() { return Session.count({ where: { expiresAt: { [Op.gt]: Date.now() } } }); },
};
export const encryptedMessageStore = {
  async push(data: any) { await Message.create({ id: data.id, data }); },
  async count() { return Message.count(); },
};
export async function initializeDatabase(seeds: any[]) {
  await sequelize.authenticate();
  // Isolate app tables from other applications sharing this database.
  await sequelize.query('CREATE SCHEMA IF NOT EXISTS "cipherdate"');
  // Create missing tables without altering or dropping existing data.
  await sequelize.sync();
  for (const data of seeds) {
    await User.findOrCreate({ where: { email: data.email.toLowerCase() }, defaults: { data } });
  }
  await Session.destroy({ where: { expiresAt: { [Op.lte]: Date.now() } } });
}
