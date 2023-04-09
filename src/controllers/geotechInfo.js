const knex = require('../../config.js');
const path = require('path');
const fs = require('fs-extra');
const multiparty = require('multiparty');

async function getAllInfoProject(req, res, next) {
  try {
    const info = await knex('gi_project').leftJoin('gi_report_si', 'id', 'gi_report_si.doc_id').select({
      id: 'gi_project.id',
      state: 'gi_project.state',
      district: 'gi_project.district',
      project_name: 'gi_project.project_name',
      project_contractor: 'gi_project.project_contractor',
      project_cost: 'gi_project.project_cost',
      project_cost_geotechnical: 'gi_project.project_cost_geotechnical',
      project_duration: 'gi_project.project_duration',
      project_procurement_method: 'gi_project.project_procurement_method',
      project_implementation_method: 'gi_project.project_implementation_method',
      project_possession_date: 'gi_project.project_possession_date',
      project_completion_date: 'gi_project.project_completion_date',
      doc_path: 'gi_report_si.doc_path',
      doc_name: 'gi_report_si.doc_name',
      created_at: 'gi_report_si.created_at'
    }).join('gi_workshop', 'id', 'gi_workshop.project_id').select({
      treatment: 'gi_workshop.treatment',
      instrumentation_type: 'gi_workshop.instrumentation_type',
      treatment_chainage: 'gi_workshop.treatment_chainage',
      treatment_notes: 'gi_workshop.treatment_notes',
      it_chainage: 'gi_workshop.it_chainage',
      it_notes: 'gi_workshop.it_notes',
    }).orderBy('created_at', 'DESC')

    res.send({
      status: true,
      message: "Success",
      data: [
        ...info
      ]
    })
  } catch (error) {
    next(error);
  }
}

async function postingGeoInfo(req, res, next) {
  try {
    const { data } = req.body;
    const {
      state,
      district,
      project_name,
      project_contractor,
      project_cost,
      project_cost_geotechnical,
      project_duration,
      project_procurement_method,
      project_implementation_method,
      project_possession_date,
      project_completion_date,
      // created_by
    } = data

    console.log(req.userId)

    const postingGi = await knex('gi_project').insert({
      state: state,
      district: district,
      project_name: project_name,
      project_contractor: project_contractor,
      project_cost: project_cost,
      project_cost_geotechnical: project_cost_geotechnical,
      project_duration: project_duration,
      project_procurement_method: project_procurement_method,
      project_implementation_method: project_implementation_method,
      project_possession_date: project_possession_date,
      project_completion_date: project_completion_date,
      created_by: req.userId
    })

    if (!postingGi) {
      res.send({
        status: false,
        message: 'Invalid insert form',
        data: null
      })
    }
    const updateData = await knex('gi_project').where({
      'created_by': req.userId,
      'project_name': project_name,
      'project_contractor': project_contractor
    })

    res.send({
      status: true,
      message: "Successfully add project",
      data: updateData
    })

  } catch (error) {
    next(error);
  }
}

async function postGeoWorkshop(req, res, next) {
  try {
    const { data } = req.body;
    const { id } = req.params;
    console.log("params", id)
    const idProjectParams = await id.toString();
    const {
      treatment,
      treatment_chainage,
      treatment_notes,
      instrumentation_type,
      it_chainage,
      it_notes
    } = data;

    const posting = await knex('gi_workshop').insert({
      project_id: idProjectParams,
      treatment: treatment,
      treatment_chainage: treatment_chainage,
      treatment_notes: treatment_notes,
      instrumentation_type: instrumentation_type,
      it_chainage: it_chainage,
      it_notes: it_notes
    })


    if (!posting) {
      res.send({
        status: false,
        message: 'Invalid insert form',
        data: null
      })
    } else {
      res.send({
        status: true,
        message: "Successfully add workshop",
        data: {
          project_id: idProjectParams,
        }
      })
    }

  } catch (error) {
    next(error);
  }
}

async function postGeoFile(req, res, next) {
  const dirValue = path.join(process.cwd(), `/documents/`)
  if (!fs.existsSync(dirValue)) {
    fs.mkdirSync(dirValue, { recursive: true });
  }
  let form = new multiparty.Form({ uploadDir: dirValue })
  res.set('x-no-compression', true)
  let singleFile;
  try {
    const { id } = req.params
    const paramsProject = await id.toString()
    form.parse(req, async function (err, fields, files) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
          data: null
        });
      }

      console.log(files)

      let fileSiGeo = files.doc_path

      if (fileSiGeo === undefined) {
        return res.status(400).send({
          "status": false,
          "message": "Document is required to upload",
          "data": null
        })
      }

      let nameFileSiGeo = [];
      let newPathFileSI = [];
      for (i = 0; i < fileSiGeo.length; i++) {
        let newPath = dirValue;
        singleFile = fileSiGeo[i];
        newPath += singleFile.originalFilename;
        fs.readFile(singleFile.path, (err, data) => {
          fs.writeFileSync(newPath, data, (err) => {
            console.log("File uploaded to  :" + newPath);
          });
        });
        if (singleFile.path !== newPath) {
          fs.unlink(singleFile.path)
          let link
          if (process.env.NODE_ENV === 'production') {
            link = [newPath.replace('/root/geomac/server/Server-GeoMAC', '/doc')]
            newPathFileSI.push(link)
            nameFileSiGeo.push(singleFile.originalFilename)
          } else {
            link = [newPath.replace('/Users/jhos/Developer/projects/GeoMAD/server/documents', '/doc')]
            newPathFileSI.push(link)
            nameFileSiGeo.push(singleFile.originalFilename)
          }
        }
      }

      await knex('gi_report_si').insert({
        doc_id: paramsProject,
        doc_path: newPathFileSI.toString(),
        doc_name: nameFileSiGeo.toString()
      })

      const returnData = await knex('gi_report_si').orderBy('created_at', 'DESC')

      res.send({
        "status": true,
        "message": `Succes upload report`,
        "data": returnData[0]
      })
      res.end()
    })

  } catch (error) {
    next(error);
  }
}


async function getProjectInfoById(req, res, next) {
  try {
    const { id } = req.params

    const data = await knex('gi_project').leftJoin('gi_report_si', 'id', 'gi_report_si.doc_id').select({
      id: 'gi_project.id',
      state: 'gi_project.state',
      district: 'gi_project.district',
      project_name: 'gi_project.project_name',
      project_contractor: 'gi_project.project_contractor',
      project_cost: 'gi_project.project_cost',
      project_cost_geotechnical: 'gi_project.project_cost_geotechnical',
      project_duration: 'gi_project.project_duration',
      project_procurement_method: 'gi_project.project_procurement_method',
      project_implementation_method: 'gi_project.project_implementation_method',
      project_possession_date: 'gi_project.project_possession_date',
      project_completion_date: 'gi_project.project_completion_date',
      doc_path: 'gi_report_si.doc_path',
      doc_name: 'gi_report_si.doc_name',
      created_at: 'gi_report_si.created_at'
    }).join('gi_workshop', 'id', 'gi_workshop.project_id').select({
      treatment: 'gi_workshop.treatment',
      instrumentation_type: 'gi_workshop.instrumentation_type',
      treatment_chainage: 'gi_workshop.treatment_chainage',
      treatment_notes: 'gi_workshop.treatment_notes',
      it_chainage: 'gi_workshop.it_chainage',
      it_notes: 'gi_workshop.it_notes',
    }).where('id', id)

    res.send({
      status: true,
      message: "success",
      data: { ...data }
    })
  } catch (error) {

  }
}

module.exports = {
  getAllInfoProject,
  postingGeoInfo,
  postGeoWorkshop,
  postGeoFile,
  getProjectInfoById
};
