/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  return Promise.all([
    knex.schema
      .dropTableIfExists('users')
      .createTable('users', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('username').notNullable().unique();
        table.string('email').unique().notNullable();
        table.string('password').notNullable();
        table.string('company_name').notNullable();
        table.enu('role', ["SA", "AD", "US"]).notNullable().defaultTo('US');
        table.string('avatar');
        table.timestamps(true, true);
      }),

    knex.schema
      .dropTableIfExists('users_token')
      .createTable('users_token', function (table) {
        table.uuid('user_id').unsigned().notNullable();
        table.string('token_string').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now()).defaultTo(null);

        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE');
        table.primary(['user_id']);
      })
  ]);
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return Promise.all([
    await knex.schema.dropTableIfExists('users'),
    await knex.schema.dropTableIfExists('users_token')
  ])
};
