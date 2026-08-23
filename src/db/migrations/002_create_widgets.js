/**
 * @param {import('knex').Knex} knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('widgets', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('type', 20).notNullable().defaultTo('contact'); // signup | contact | cta
    table.string('title', 255).notNullable();
    table.text('description').defaultTo('');
    table.jsonb('fields').notNullable().defaultTo('[]');
    table.string('button_text', 100).defaultTo('Submit');
    table.jsonb('display_options').defaultTo('{}');
    table.integer('version').notNullable().defaultTo(1);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Index for tenant-scoped queries
    table.index(['user_id']);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('widgets');
};
