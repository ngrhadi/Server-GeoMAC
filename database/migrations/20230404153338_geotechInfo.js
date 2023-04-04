/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema
    .dropTableIfExists('gi_project')
    .createTable('gi_project', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('state').notNullable();
      table.string('district').notNullable();
      table.string('project_name').notNullable();
      table.string('project_contractor').notNullable();
      table.string('project_cost').notNullable();
      table.string('project_cost_geotechnical').notNullable();
      table.string('project_duration').notNullable();
      table.string('project_procurement_method');
      table.string('project_implementation_method');
      table.date('project_possession_date');
      table.date('project_completion_date');
      table.string('created_by').notNullable();
    })

  return true;
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return knex.schema.dropTableIfExists('gi_project')
};
