
var covid_cohort_app = covid_cohort_app || {}

covid_cohort_app.data_url = 'https://services6.arcgis.com/LZwBmoXba0zrRap7/arcgis/rest/services/COVID_19_Prod_B_feature/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Case_ID%20desc&resultOffset=0&resultRecordCount=2000&cacheHint=true'


// Pick the kind of numbers to show
covid_cohort_app.tableValues = 'pct'
// covid_cohort_app.tableValues = 'number'


covid_cohort_app.optionChoices = {
  age: [
    { 
      id: '0to30',
      label: '<30y old',
      values: [0,29]
    }
    ,{ 
      id: '30-50',
      label: '30-49y old',
      values: [30,49]
    }
    ,{ 
      id: '50+',
      label: '>50y old',
      values: [50,999]
    }
    ,{ 
      id: 'all',
      label: 'Any Age',
      values: [0,999]
    }
  ],
  gender: [
    {
      id: 'm',
      label: 'Male',
      values: ['M']
    },
    {
      id: 'f',
      label: 'Female',
      values: ['F']
    },
    {
      id: 'all',
      label: 'All',
      values: ['F', 'M']
    }
  ]
}


covid_cohort_app.options = {
  gender: 'all',
  age: '50+'
}

// Load Data
console.log( covid_cohort_app.data_url )
d3.json(covid_cohort_app.data_url).then( function(data) {
  console.log( 'ok')
  console.log(data);
  covid_cohort_app.read_cases( data.features)
});

// Date_of_Co
// Date_of_Di
// Case_ID
// Imported_o
// Age
// Gender
// Nationalit
// Status
// Death?

covid_cohort_app.params = {}
covid_cohort_app.cohorts = {}


covid_cohort_app.prepareAnalyseAttributes = function(){
  covid_cohort_app.attributes = []
  covid_cohort_app.attributes.push( 'Date_of_Co' )
  covid_cohort_app.attributes.push( 'Date_of_Di' )
  covid_cohort_app.attributes.push( 'Case_ID' )
  covid_cohort_app.attributes.push( 'Imported_o' )
  covid_cohort_app.attributes.push( 'Age' )
  covid_cohort_app.attributes.push( 'Gender' )
  covid_cohort_app.attributes.push( 'Nationalit' )
  covid_cohort_app.attributes.push( 'Status' )

  covid_cohort_app.attributes.forEach( function( oneAttr ){
    covid_cohort_app.params[ oneAttr ] = []
  } )
}


covid_cohort_app.read_cases = function( cases_data ){
  
  covid_cohort_app.prepareAnalyseAttributes()

  // Read each cases
  cases_data.forEach( function( oneCase ){
    covid_cohort_app.readOneCase( oneCase )
  } )

  console.log( 'covid_cohort_app.params', covid_cohort_app.params )
  console.log( 'covid_cohort_app.cohorts', covid_cohort_app.cohorts )
  console.log( 'covid_cohort_app.cases', covid_cohort_app.cases )
  covid_cohort_app.cohortCalculations()
  covid_cohort_app.launchGrid()
}



covid_cohort_app.cases = []
covid_cohort_app.relativeDays = []
covid_cohort_app.readOneCase = function( oneCase ){

  // Shorthand access
  let caseAttributes = oneCase.attributes

  // Test cases for filtering
  if( !covid_cohort_app.isCaseWithinFilter( caseAttributes ) ) return

  let parsedAttributes = {}

  // Get all attributes
  covid_cohort_app.attributes.forEach( function( oneAttr ){
    let caseAttr = caseAttributes[ oneAttr ]
    parsedAttributes[ oneAttr ] = caseAttr

    if( oneAttr === 'Date_of_Co' ){
      caseAttr = moment( caseAttr ).format( 'YYYY-MM-DD' )
      parsedAttributes.caseCohortMoment = moment( caseAttr )
      parsedAttributes.caseCohort = parsedAttributes.caseCohortMoment.format( 'YYYY-MM-DD' )
    }

    // Record potential values for attribute
    if( !covid_cohort_app.params[ oneAttr ].includes( caseAttr ) ){
      covid_cohort_app.params[ oneAttr ].push( caseAttr )
    }
  } )

  covid_cohort_app.cohorts[ parsedAttributes.caseCohort ] = covid_cohort_app.cohorts[ parsedAttributes.caseCohort ] || {
    cohort: parsedAttributes.caseCohort,
    count: 0,
    Discharged: 0,
    Deceased: 0
  }

  covid_cohort_app.cohorts[ parsedAttributes.caseCohort ].count ++

  // Special attribute needed
  parsedAttributes.caseStatus = caseAttributes[ 'Status' ]

  // Counting
  covid_cohort_app.cohorts[ parsedAttributes.caseCohort ][ parsedAttributes.caseStatus ] = covid_cohort_app.cohorts[ parsedAttributes.caseCohort ][ parsedAttributes.caseStatus ] || 0
  covid_cohort_app.cohorts[ parsedAttributes.caseCohort ][ parsedAttributes.caseStatus ] ++

  // Parse Discharged date (or death)
  if( parsedAttributes.Date_of_Di !== null ){
    parsedAttributes.caseDischargeMoment = moment( parsedAttributes.Date_of_Di )
    if( moment.isMoment( parsedAttributes.caseDischargeMoment ) ){
      parsedAttributes.caseDischargeDate = parsedAttributes.caseDischargeMoment.format( 'YYYY-MM-DD')
      parsedAttributes.caseDischargeAfterDays = parsedAttributes.caseDischargeMoment.diff( parsedAttributes.caseCohortMoment, 'days' )
    }
  }

  covid_cohort_app.cases.push( {
    original: caseAttributes,
    parsed: parsedAttributes
   } )


   if( Number.isFinite( parsedAttributes.caseDischargeAfterDays ) ){
    if( !covid_cohort_app.relativeDays.includes( parsedAttributes.caseDischargeAfterDays ) ){
      covid_cohort_app.relativeDays.push( parsedAttributes.caseDischargeAfterDays )
    }
  }
}


covid_cohort_app.isCaseWithinFilter = function( caseAttributes ){
  console.log( caseAttributes )

  // Test Gender
  let genderFilterId = covid_cohort_app.options.gender
  let genderFilterValue = covid_cohort_app.optionChoices.gender.find( function( oneChoice ){ 
    return oneChoice.id === genderFilterId
  } )
  let isGenderPassing = genderFilterValue.values.includes( caseAttributes.Gender )
  

  // Test Age
  let ageFilterId = covid_cohort_app.options.age
  let ageFilterValue = covid_cohort_app.optionChoices.age.find( function( oneChoice ){ 
    return oneChoice.id === ageFilterId
  } )
  let isAgePassing = ageFilterValue.values[0] <= caseAttributes.Age && caseAttributes.Age <= ageFilterValue.values[1] 

  // console.log( isGenderPassing, isAgePassing )

  return isGenderPassing && isAgePassing
}


covid_cohort_app.cohortCalculations = function(){
  covid_cohort_app.maxDailyCases = false
  Object.values( covid_cohort_app.cohorts ).forEach( function( oneCohort ){
    oneCohort.pctDischarged = 100 * oneCohort.Discharged / oneCohort.count

    oneCohort.cohortAge = moment().diff( moment( oneCohort.cohort, 'YYYY-MM-DD'), 'days' )

    if( !covid_cohort_app.maxDailyCases || covid_cohort_app.maxDailyCases < oneCohort.count ){
      covid_cohort_app.maxDailyCases = oneCohort.count
    }
  } )
}


covid_cohort_app.setGridOptions = function(){
  let gridOptions = {}

  gridOptions.suppressPropertyNamesCheck = true
  gridOptions.rowData = Object.values( covid_cohort_app.cohorts )
  gridOptions.columnDefs = covid_cohort_app.setColDefs()

  gridOptions.enableRangeSelection = true
  gridOptions.statusBar = {
    statusPanels: [
        { statusPanel: 'agAggregationComponent' }
    ]
  }
  gridOptions.defaultColDef = {
    sortable: true,
    resizable: true,
    filter: true,
    suppressMovable: true
  }

  return gridOptions
}

covid_cohort_app.setColDefs = function(){
  let colDefs = []
  colDefs.push(
    {
      headerName: 'Confirmation Date',
      field: 'cohort',
      width: 150,
      pinned: 'left'
    }
  )
  colDefs.push(
    {
      headerName: 'Cohort Age',
      field: 'cohortAge',
      width: 110,
      pinned: 'left',
      type: ['numericColumn']
    }
  )
  colDefs.push(
    {
      headerName: 'Cases',
      field: 'count',
      width: 80,
      pinned: 'left',
      type: ['numericColumn'],
      cellStyle: function( params ){
        // Orange gradient
        let backgroundColor = 'rgba(214,202,89,' + params.data.count/covid_cohort_app.maxDailyCases + ')'
        return { backgroundColor }
      }
    }
  )
  colDefs.push(
    {
      headerName: 'Discharged',
      field: 'Discharged',
      width: 120,
      pinned: 'left',
      type: ['numericColumn'],
      cellClass: function( params ){
        let classes = [ 'align-right']
        classes.push( covid_cohort_app.applyNumberStyle( params.value ) )
        return classes
      }
    }
  )
  colDefs.push(
    {
      headerName: '% Discharged',
      width: 90,
      pinned: 'left',
      type: ['numericColumn'],
      valueGetter: function( params ){
        return params.data.pctDischarged
      },
      valueFormatter: function( params ){
        return covid_cohort_app.formatPct( params.value )
      },
      cellClass: function( params ){
        let classes = [ 'align-right']
        classes.push( covid_cohort_app.applyNumberStyle( params.value ) )
        return classes
      },
      cellStyle: function( params ){
        return covid_cohort_app.applyCohortBackground( params.value )
      }
    }
  )

  colDefs.push(
    {
      headerName: 'Deceased',
      field: 'Deceased',
      width: 100,
      pinned: 'left',
      type: ['numericColumn'],
      cellClass: function( params ){
        let classes = [ 'align-right']
        classes.push( covid_cohort_app.applyNumberStyle( params.value ) )
        return classes
      },
    }
  )

  // Relative Days columns
  // covid_cohort_app.relativeDays.sort( function(a,b){return a-b})
  let maxRelativeDay = false
  covid_cohort_app.relativeDays.forEach( function( oneRelativeDay ){
    if( maxRelativeDay === false || maxRelativeDay < oneRelativeDay ){
      maxRelativeDay = oneRelativeDay
    }
  } )

  let oneRelativeDay = 1

  while( oneRelativeDay <= maxRelativeDay ){
    colDefs.push(
      {
        headerName: 'D+' + oneRelativeDay,
        width: 80,
        type: ['numericColumn'],
        app: {
          relativeDays: oneRelativeDay
        },
        valueGetter: function( params ){
          // console.log( params )
          let cohortDischargedCasesToDate = 0
          let columnRelativeDays = params.colDef.app.relativeDays

          if( params.data.cohortAge < columnRelativeDays ){
            return false
          }

          covid_cohort_app.cases.forEach( function( oneCase ){
            // is case within cohort?
            let isCaseWithinCohort = oneCase.parsed.caseCohort === params.data.cohort

            // case discharged within days
            let isCaseDischarged = ( Number.isFinite( oneCase.parsed.caseDischargeAfterDays ) && oneCase.parsed.caseDischargeAfterDays <= columnRelativeDays )

            // is Case Discharged (otherwise discharge date is for death)
            let isCaseAboutDischarged = oneCase.parsed.Status === 'Discharged'

            if( isCaseWithinCohort && isCaseDischarged && isCaseAboutDischarged ){
              cohortDischargedCasesToDate ++
            }
          } )

          if( covid_cohort_app.tableValues === 'number' ){
            return cohortDischargedCasesToDate
          }else{
            return 100 * cohortDischargedCasesToDate / params.data.count
          }
        },
        valueFormatter: function( params ){
          if( params.value === false ){
            return '-'
          }

          if( covid_cohort_app.tableValues === 'pct' ){
            return covid_cohort_app.formatPct( params.value )
          }else{
            return params.value
          }
        },
        cellClass: function( params ){
          let classes = [ 'align-right']
          classes.push( covid_cohort_app.applyNumberStyle( params.value ) )
          return classes
        },
        cellStyle: function( params ){
          if( covid_cohort_app.tableValues === 'pct' ){
            return covid_cohort_app.applyCohortBackground( params.value )
          }
        }
      }
    )
    oneRelativeDay ++
  }

  return colDefs
}



covid_cohort_app.launchGrid = function(){
  covid_cohort_app.setGridOptions()

  // lookup the container we want the Grid to use
  var eGridDiv = document.querySelector('#cohortGrid')

  // create the grid passing in the div to use together with the columns & data we want to use
  new agGrid.Grid(eGridDiv, covid_cohort_app.setGridOptions() )
}