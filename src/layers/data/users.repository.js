const db = require('../../db/connection');
const { v4: uuidv4 } = require('uuid');

const UsersRepository = {
  async create(email, passwordHash) {
    const id = uuidv4();
    await db('users').insert({
      id,
      email,
      password_hash: passwordHash,
      created_at: new Date(),
    });
    return this.findById(id);
  },

  async findByEmail(email) {
    return db('users').where({ email }).first();
  },

  async findById(id) {
    return db('users').where({ id }).first();
  },
};

module.exports = UsersRepository;
