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
      console.log(fileSiGeo)

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
      data: { ...data[0] }
    })
  } catch (error) {
    next(error)
  }
}

async function deleteProjectInfo(req, res, next) {
  try {
    const { id } = req.params
    await knex('gi_workshop')
      .where('project_id', id) // specify the condition for deletion
      .join('gi_project', 'gi_workshop.project_id', 'gi_project.id')
      .del();

    const fileReport = await knex('gi_report_si').select('doc_path').where('doc_id', id)

    if (fileReport.length > 0) {
      let link = '';
      let pathSplit = fileReport[0].doc_path.split(',')
      for (let i = 0; i < pathSplit.length; i++) {
        let newPath = pathSplit[i];
        if (process.env.NODE_ENV === 'production') {
          link = newPath.replace('/doc', '/root/geomac/server/Server-GeoMAC')
          fs.unlink(link)
        } else {
          link = newPath.replace('/doc', '/Users/jhos/Developer/projects/GeoMAD/server/documents')
          fs.unlink(link)
        }
      }
    }

    // Delete from table3
    await knex('gi_report_si')
      .where('doc_id', id)
      .join('gi_project', 'gi_report_si.doc_id', 'gi_project.id') // specify the condition for deletion
      .del();
    // Delete from table1
    await knex('gi_project')
      .where('id', id)
      .del();

    res.send({
      status: true,
      message: 'Data deleted successfully.',
      data: null
    })
  } catch (error) {
    next(error)
  }
}

async function deleteFileEdit(req, res, next) {
  try {
    const id = req.params.id
    const { data } = req.body
    const { fileNameDeleted, filePathDeleted } = data
    const dataFile = await knex('gi_report_si').where('doc_id', id)

    // console.log(dataFile)
    let newFileName = ''
    let newPathName = ''

    const filterPathAndName = dataFile.filter(val => {
      newFileName = val.doc_name.split(',').filter(str => str !== fileNameDeleted)
      newPathName = val.doc_path.split(',').filter(str => str !== filePathDeleted)
    })
    filterPathAndName
    console.log(newFileName)
    console.log(newPathName)
    await knex('gi_report_si').where('doc_id', id).update({
      doc_name: newFileName.toString(),
      doc_path: newPathName.toString()
    });

    let link;


    // if (process.env.NODE_ENV === 'production') {
    //   let link = filePathDeleted.replace('/doc', '/root/geomac/server/Server-GeoMAC')
    //   fs.unlink(link)
    // } else {
    //   link = filePathDeleted.replace('/doc', '/Users/jhos/Developer/projects/GeoMAD/server/documents')
    //   fs.unlink(link)
    // }

    res.send({
      status: true,
      message: 'Success Delete file',
      data: id
    })


  } catch (error) {
    next(error)
  }
}

async function editProjectGeoInfo(req, res, next) {
  try {
    const { data } = req.body;
    const { id } = req.params
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

    const postingGi = await knex('gi_project').where('id', id).update({
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
    next(error)
  }
}

// async function editProjectGeoWorkshop(req, res, next) {
//   try {

//   } catch (error) {
//     next(error)
//   }
// }

async function editProjectGeoFile(req, res, next) {
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

      const oldFilePath = await knex('gi_report_si').select(['doc_path']).where({ 'doc_id': req.params.id });


      let fileSiGeo = files.doc_path

      if (fileSiGeo === undefined) {
        return res.status(400).send({
          "status": false,
          "message": "Document is required to upload",
          "data": null
        })
      }

      if (oldFilePath.length === 0) {
        console.log("masuk sini 1")
        let failedFile = files.doc_path
        for (let i = 0; i < failedFile.length; i++) {
          singleFile = failedFile[i]
          console.log(singleFile)
          fs.unlink(singleFile.path)
        }
        return res.status(401).send({
          "status": false,
          "message": "Undefined file",
          "data": null
        })
      }

      const parseOldFilePath = JSON.parse(JSON.stringify(oldFilePath))

      let nameFileSiGeo = [];
      let newPathFileSI = [];
      for (i = 0; i < fileSiGeo.length; i++) {
        let newPath = dirValue + 'update';
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

      if (parseOldFilePath[0].doc_path?.length > 0) {
        let oldLink = parseOldFilePath[0].doc_path.split(',')
        if (process.env.NODE_ENV === 'production') {
          await oldLink.forEach(v => fs.unlink(v.replace('/doc', '/root/geomac/server/Server-GeoMAC')))
        } else {
          await oldLink.forEach(v => fs.unlink(v.replace('/doc', '/Users/jhos/Developer/projects/GeoMAD/server/documents')))
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

async function editProjectWorkshop(req, res, next) {
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

    const posting = await knex('gi_workshop').update({
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
        message: "Successfully edit workshop",
        data: {
          project_id: idProjectParams,
        }
      })
    }
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAllInfoProject,
  postingGeoInfo,
  postGeoWorkshop,
  postGeoFile,
  getProjectInfoById,
  deleteProjectInfo,
  deleteFileEdit,
  editProjectGeoInfo,
  editProjectWorkshop,
  editProjectGeoFile,
  // editProjectGeoWorkshop,
};
