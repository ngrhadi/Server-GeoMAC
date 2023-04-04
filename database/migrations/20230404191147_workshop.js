/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return Promise.all([

    knex.schema
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
      }),

    knex.schema.dropTableIfExists('gi_workshop')
      .createTable('gi_workshop', function (table) {
        table.uuid('project_id').unsigned().notNullable();
        table.string('treatment', 2000);
        table.string('treatment_chainage', 2000);
        table.string('treatment_notes', 2000);
        table.string('instrumentation_type', 2000);
        table.string('it_chainage', 2000);
        table.string('it_notes', 2000);

        table.foreign('project_id').references('id').inTable('gi_project').onDelete('CASCADE').onUpdate('CASCADE');
        table.primary(['project_id']);
      })
  ])
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('gi_project'),
    knex.schema.dropTableIfExists('gi_workshop')
  ])
};
