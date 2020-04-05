
var covid_cohort_app = covid_cohort_app || {}


// Live file - Issue: needs a token? not sure how to get it for daily refresh
covid_cohort_app.data_url = 'https://services6.arcgis.com/LZwBmoXba0zrRap7/arcgis/rest/services/COVID_19_Prod_B_feature/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Case_ID%20desc&resultOffset=0&resultRecordCount=2000&cacheHint=true'

// Using stored data
covid_cohort_app.data_url = 'https://floriancornu.github.io/covid-cohorts/data/20200404covid.txt'


// Pick the kind of numbers to show
covid_cohort_app.tableValues = 'pct'
// covid_cohort_app.tableValues = 'number'


// Starting options
covid_cohort_app.options = {
  gender: 'all',
  age: 'all'
}

// Load Data
covid_cohort_app.readData = function(){
  console.log( covid_cohort_app.data_url )

  let readingPromise = new Promise( function( resolve, reject ){
    d3.json(covid_cohort_app.data_url).then( function(data) {
      console.log( 'file data', data )

      covid_cohort_app.originData = data.features

      resolve( true )
    })
  } )

  return readingPromise
}



// Date_of_Co
// Date_of_Di
// Case_ID
// Imported_o
// Age
// Gender
// Nationalit
// Status
// Death?

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
  covid_cohort_app.attributes.push( 'Current_Lo' )

  covid_cohort_app.params = {}
  covid_cohort_app.attributes.forEach( function( oneAttr ){
    covid_cohort_app.params[ oneAttr ] = []
  } )
}


covid_cohort_app.read_cases = function(){
  covid_cohort_app.cohorts = {}
  covid_cohort_app.cases = []

  cases_data = covid_cohort_app.originData
  covid_cohort_app.prepareAnalyseAttributes()

  // Read each cases
  cases_data.forEach( function( oneCase ){
    covid_cohort_app.readOneCase( oneCase )
  } )

  console.log( 'covid_cohort_app.params', covid_cohort_app.params )
  console.log( 'covid_cohort_app.cohorts', covid_cohort_app.cohorts )
  console.log( 'covid_cohort_app.cases', covid_cohort_app.cases )
  covid_cohort_app.cohortCalculations()

  covid_cohort_app.setGridRows()
}


// covid_cohort_app.relativeDays = []
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
      let cohort = covid_cohort_app.readCaseCohort( caseAttributes )

      caseAttr = cohort.caseCohort
      parsedAttributes.caseCohort = cohort.caseCohort
      parsedAttributes.caseCohortMoment = cohort.caseCohortMoment
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
    Deceased: 0,
    resolved: 0
  }

  covid_cohort_app.cohorts[ parsedAttributes.caseCohort ].count ++

  // Special attribute needed
  parsedAttributes.caseStatus = caseAttributes[ 'Status' ]

  // Counting
  covid_cohort_app.cohorts[ parsedAttributes.caseCohort ][ parsedAttributes.caseStatus ] = covid_cohort_app.cohorts[ parsedAttributes.caseCohort ][ parsedAttributes.caseStatus ] || 0
  covid_cohort_app.cohorts[ parsedAttributes.caseCohort ][ parsedAttributes.caseStatus ] ++

  // A case is resolved when discharged or deceased
  if( [ 'Discharged', 'Deceased' ].includes( parsedAttributes.caseStatus ) ){
    let caseStatus
    covid_cohort_app.cohorts[ parsedAttributes.caseCohort ].resolved ++
    parsedAttributes.isResolved = true
  }

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


  // if( Number.isFinite( parsedAttributes.caseDischargeAfterDays ) ){
  //   if( !covid_cohort_app.relativeDays.includes( parsedAttributes.caseDischargeAfterDays ) ){
  //     covid_cohort_app.relativeDays.push( parsedAttributes.caseDischargeAfterDays )
  //   }
  // }
}


covid_cohort_app.isCaseWithinFilter = function( caseAttributes ){
  // console.log( caseAttributes )

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
    oneCohort.pctDeceased = 100 * oneCohort.Deceased / oneCohort.count
    oneCohort.pctHospitalised = 100 * oneCohort.Hospitalised / oneCohort.count

    oneCohort.cohortAge = moment().diff( moment( oneCohort.cohort, 'YYYY-MM-DD'), 'days' )

    // Track max daily case for cohort coloring
    if( !covid_cohort_app.maxDailyCases || covid_cohort_app.maxDailyCases < oneCohort.count ){
      covid_cohort_app.maxDailyCases = oneCohort.count
    }
  } )
}



covid_cohort_app.setGridRows = function(){
  covid_cohort_app.gridOptions.api.setRowData( Object.values( covid_cohort_app.cohorts ) )

  covid_cohort_app.calculateTotals()
  covid_cohort_app.gridOptions.api.setPinnedBottomRowData( [
    {
      id: 'Total',
      totalsToShow: [ 'count', 'resolved', 'Discharged', 'Deceased', 'Hospitalised' ],
      pctDenominator: 'count'

    },
    {
      id: 'Resolved',
      totalsToShow: [ 'resolved', 'Discharged', 'Deceased' ],
      pctDenominator: 'resolved'
    }
  ] )
}






covid_cohort_app.setGridOptions = function(){
  let gridOptions = {}

  gridOptions.suppressPropertyNamesCheck = true
  gridOptions.suppressMenuHide = false
  gridOptions.rowData = []
  
  
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
    suppressMovable: true,
    suppressMenu: true
  }

  // Style footer rows
  gridOptions.getRowClass = function( params ){
    let classes = []
    // console.log( params )
    if( params.node.rowPinned ){
      classes.push( 'footer' )
    }
    return classes
  }

  return gridOptions
}

covid_cohort_app.setColDefs = function(){
  let colDefs = []

  let cohortColDefGroup = {
    headerName: 'Cohort',
    children: []
  }

  cohortColDefGroup.children.push(
    {
      headerName: 'Days Ago',
      field: 'cohortAge',
      width: 80,
      pinned: 'left',
      type: ['numericColumn'],
      suppressMenu: true
    }
  )
  cohortColDefGroup.children.push(
    {
      headerName: 'Confirmed on',
      width: 110,
      pinned: 'left',
      valueGetter: function( params ){
        if( params.node.rowPinned ){
          return params.data.id
        }else{
          return params.data.cohort
        }
      }
    }
  )
  
  cohortColDefGroup.children.push(
    {
      headerName: 'Cases',
      width: 80,
      pinned: 'left',
      type: ['numericColumn'],
      app: {
        property: 'count'
      },
      valueGetter: covid_cohort_app.cohortTotalValueGetter,
      valueFormatter: covid_cohort_app.cohortTotalFormatter,
      cellClass: covid_cohort_app.cohortTotalCellClass,
      cellStyle: function( params ){
        // Orange gradient
        let backgroundColor = 'rgba(214,202,89,' + params.data.count/covid_cohort_app.maxDailyCases + ')'
        return { backgroundColor }
      }
    }
  )
  colDefs.push( cohortColDefGroup )


  let dischargedColDefs = {
    headerName: 'Discharged',
    children: []
  }
  dischargedColDefs.children.push(
    {
      headerName: 'Cases',
      width: 80,
      pinned: 'left',
      type: ['numericColumn'],
      app: {
        property: 'Discharged'
      },
      valueGetter: covid_cohort_app.cohortTotalValueGetter,
      valueFormatter: covid_cohort_app.cohortTotalFormatter,
      cellClass: covid_cohort_app.cohortTotalCellClass
    }
  )
  dischargedColDefs.children.push(
    {
      headerName: '%',
      width: 70,
      pinned: 'left',
      type: ['numericColumn'],
      app: {
        property: 'Discharged'
      },
      valueGetter: covid_cohort_app.cohortTotalPctValueGetter,
      valueFormatter: covid_cohort_app.cohortTotalPctFormatter,
      cellClass: covid_cohort_app.cohortTotalCellClass,
      cellStyle: function( params ){
        return covid_cohort_app.applyCohortBackground( params.value )
      }
    }
  )
  colDefs.push( dischargedColDefs )


  let deceasedColDefs = {
    headerName: 'Deceased',
    children: []
  }
  deceasedColDefs.children.push(
    {
      headerName: 'Cases',
      width: 80,
      pinned: 'left',
      type: ['numericColumn'],
      // hide: true,
      app: {
        property: 'Deceased'
      },
      valueGetter: covid_cohort_app.cohortTotalValueGetter,
      valueFormatter: covid_cohort_app.cohortTotalFormatter,
      cellClass: covid_cohort_app.cohortTotalCellClass
    }
  )
  deceasedColDefs.children.push(
    {
      headerName: '%',
      width: 70,
      pinned: 'left',
      type: ['numericColumn'],
      // hide: true,
      app: {
        property: 'Deceased'
      },
      valueGetter: covid_cohort_app.cohortTotalPctValueGetter,
      valueFormatter: covid_cohort_app.cohortTotalPctFormatter,
      cellClass: covid_cohort_app.cohortTotalCellClass,
    }
  )
  colDefs.push( deceasedColDefs )


  let resolvedColDefs = {
    headerName: 'Total Resolved',
    children: []
  }
  resolvedColDefs.children.push(
    {
      headerName: 'Cases',
      width: 80,
      pinned: 'left',
      type: ['numericColumn'],
      // hide: true,
      app: {
        property: 'resolved'
      },
      valueGetter: covid_cohort_app.cohortTotalValueGetter,
      valueFormatter: covid_cohort_app.cohortTotalFormatter,
      cellClass: covid_cohort_app.cohortTotalCellClass
    }
  )
  resolvedColDefs.children.push(
    {
      headerName: '%',
      width: 70,
      pinned: 'left',
      type: ['numericColumn'],
      // hide: true,
      app: {
        property: 'resolved'
      },
      valueGetter: covid_cohort_app.cohortTotalPctValueGetter,
      valueFormatter: covid_cohort_app.cohortTotalPctFormatter,
      cellClass: covid_cohort_app.cohortTotalCellClass,
    }
  )
  colDefs.push( resolvedColDefs )




  let hospitalisedColDefs = {
    headerName: 'Still Hospitalised',
    children: []
  }
  hospitalisedColDefs.children.push(
    {
      headerName: 'Cases',
      width: 80,
      pinned: 'left',
      type: ['numericColumn'],
      // hide: true,
      app: {
        property: 'Hospitalised'
      },
      valueGetter: covid_cohort_app.cohortTotalValueGetter,
      valueFormatter: covid_cohort_app.cohortTotalFormatter,
      cellClass: covid_cohort_app.cohortTotalCellClass
    }
  )
  hospitalisedColDefs.children.push(
    {
      headerName: '%',
      width: 70,
      pinned: 'left',
      type: ['numericColumn'],
      // hide: true,
      app: {
        property: 'Hospitalised'
      },
      valueGetter: covid_cohort_app.cohortTotalPctValueGetter,
      valueFormatter: covid_cohort_app.cohortTotalPctFormatter,
      cellClass: covid_cohort_app.cohortTotalCellClass,
    }
  )
  colDefs.push( hospitalisedColDefs )

  // Relative Days columns
  let maxRelativeDay = covid_cohort_app.findMaxRelativeDay()
  let oneRelativeDay = 0

  let cohortDaysColDefs = {
    headerName: 'Discharged, x Days after confirmation',
    children: []
  }

  while( oneRelativeDay <= maxRelativeDay ){
    cohortDaysColDefs.children.push(
      {
        headerName: 'D+' + oneRelativeDay,
        width: 60,
        type: ['numericColumn'],
        app: {
          relativeDays: oneRelativeDay
        },
        valueGetter: function( params ){
          // console.log( params )
          if( params.node.rowPinned ){
            return false
          }
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
    // 
    // oneRelativeDay ++ // Daily
    oneRelativeDay += 3 // Weekly
  }

  colDefs.push( cohortDaysColDefs )

  return colDefs
}


