/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return Promise.all([

    knex.schema
      // .dropTableIfExists('gi_project')
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
        table.increments('id_workshop').primary();
        table.uuid('project_id', 36).unsigned();
        table.string('treatment', 2000);
        table.string('treatment_chainage', 2000);
        table.string('treatment_notes', 2000);
        table.string('instrumentation_type', 2000);
        table.string('it_chainage', 2000);
        table.string('it_notes', 2000);

        table.foreign('project_id').references('id').inTable('gi_project')
      }),
    knex.schema.dropTableIfExists('gi_report_si')
      .createTable('gi_report_si', function (table) {
        table.increments('id_file').primary();
        table.uuid('doc_id', 36).unsigned();
        table.string('doc_path', 2000);
        table.string('doc_name');
        table.timestamps(true, true);

        table.foreign('doc_id').references('id').inTable('gi_project');
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
    knex.schema.dropTableIfExists('gi_workshop'),
    knex.schema.dropTableIfExists('gi_report_si')
  ])
};
