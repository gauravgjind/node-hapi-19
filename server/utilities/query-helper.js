const generateQuery = async (model, queryParams) => {
  const query = {}
  let params = Object.keys(queryParams)
  const filterOption = ['limit', 'skip', 'search', 'sort', 'page', 'populate']
  params = params.filter(p => filterOption.indexOf(p) == -1)

  params.forEach(param => {
    query[param] = queryParams[param]
  })

  const countQuery = model.find(query)
  const mongooseQuery = model.find(query)
  let limit = 10
  let skip = 0
  let page = 1
  let hasMany = null

  if (queryParams.sort) {
    var sorts = queryParams.sort
    if ((sorts.charAt(0) === ' ' || sorts.charAt(0) === '-') && sorts !== '') {
      mongooseQuery.sort(sorts)
      mongooseQuery.collation({ locale: 'en' })
    }
  } else {
    mongooseQuery.sort('-createdAt')
  }

  generatePopulate(mongooseQuery, model, queryParams)

  if (queryParams.search) {
    var likeQuery = []
    var search = queryParams.search.split(' ')
    const searchableFields = filterFields(model, 'canSearch')
    searchableFields.forEach(field => {
      search.forEach(se => {
        likeQuery.push({
          [field]: {
            $regex: se,
            $options: 'i'
          }
        })
      })
    })
    mongooseQuery.or(likeQuery)
    countQuery.or(likeQuery)
  }
  if (queryParams.limit === 'All') {
    queryParams.limit = ''
    hasMany = false
  }
  if (queryParams.limit) {
    limit = parseInt(queryParams.limit)
    mongooseQuery.limit(limit)
  }
  if (queryParams.page) {
    page = parseInt(queryParams.page)
    skip = (parseInt(page) - 1) * parseInt(limit)
    mongooseQuery.skip(skip)
  }
  const result = await mongooseQuery.lean()
  const totalCountResult = await countQuery.countDocuments()

  if (queryParams.limit) {
    if (skip + result.length >= totalCountResult) {
      hasMany = false
    } else {
      hasMany = true
    }
  }

  return {
    list: result,
    count: result.length,
    total: totalCountResult,
    hasMany: hasMany,
    from: skip + 1,
    to: skip + result.length
  }
}
const generatePopulate = async (mongooseQuery, model, queryParams) => {
  if (mongooseQuery && model && queryParams) {
    if (queryParams.populate !== undefined) {
      const populates = queryParams.populate.replace(/ /g, '').split(',')

      const virtualPopulateFields = Object.keys(model.schema.virtuals).filter(
        v => v !== 'id'
      )
      if (virtualPopulateFields.length > 0) {
        populates.push(...virtualPopulateFields)
      }

      const populateFields = filterFields(model, 'canPopulate')
      // Comment code for populate virtual fields
      // const schemas = model.schema.obj
      // let populateModel
      // let populateSelect
      // let ref

      populates.forEach(p => {
        if (p !== '' && populateFields.indexOf(p) !== -1) {
          if (p.indexOf('.') !== -1) {
            // ref = schemas[p.split('.')[0]].type.obj[p.split('.')[1]].ref
            // populateModel = require(`@models/${ref}.model`).schema
            // populateSelect = filterFields(populateModel, 'canSelect')
            mongooseQuery.populate({
              path: p
              // select: populateSelect
            })
          } else {
            // populateModel = require(`@models/${schemas[p].ref}.model`).schema
            // populateSelect = filterFields(populateModel, 'canSelect')
            mongooseQuery.populate({
              path: p
              // select: populateSelect
            })
          }
        }
      })
    }
  }
}
const filterFields = (model, paramType) => {
  const schemas = model.schema.obj
  const populateFields = Object.keys(model.schema.obj)
  const returnFields = []
  populateFields.forEach(field => {
    if (
      schemas[field].type &&
      schemas[field].type.schemaName !== undefined &&
      schemas[field][paramType] !== undefined &&
      schemas[field][paramType] === true
    ) {
      returnFields.push(field)
    } else if (schemas[field].type && schemas[field].type.obj !== undefined) {
      const subSchemas = schemas[field].type.obj
      const populateSubFields = Object.keys(schemas[field].type.obj)
      populateSubFields.forEach(subField => {
        if (
          subSchemas[subField][paramType] !== undefined &&
          subSchemas[subField][paramType] === true
        ) {
          returnFields.push(`${field}.${subField}`)
        }
      })
    }
  })

  if (paramType === 'canPopulate') {
    returnFields.push(
      ...Object.keys(model.schema.virtuals).filter(v => v !== 'id')
    )
  }

  return returnFields
}
module.exports = {
  generateQuery: generateQuery,
  filterFields: filterFields
}
