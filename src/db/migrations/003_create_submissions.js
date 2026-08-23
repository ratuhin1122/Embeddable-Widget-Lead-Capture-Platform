/**
 * @param {import('knex').Knex} knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('submissions', (table) => {
    table.uuid('id').primary();
    table.uuid('widget_id').notNullable().references('id').inTable('widgets').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.jsonb('data').notNullable().defaultTo('{}');
    table.string('ip_address', 45);
    table.jsonb('geo_data').defaultTo(null);
    table.boolean('honeypot_triggered').notNullable().defaultTo(false);
    table.string('idempotency_key', 255).unique();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes for dashboard queries
    table.index(['widget_id']);
    table.index(['user_id']);
    table.index(['created_at']);
    table.index(['user_id', 'created_at']);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('submissions');
};
