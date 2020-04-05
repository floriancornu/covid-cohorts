
var covid_cohort_app = covid_cohort_app || {}


covid_cohort_app.formatPct = function( value, numberDecimals = 0 ){
  return accounting.formatMoney( value, { symbol: '%', format: '%v%s', precision: numberDecimals, thousands: ',', decimal: '.' } )
}

covid_cohort_app.formatNumber = function( value ){
  return accounting.formatMoney( value, { symbol: '', format: '%v%s', precision: 0, thousands: ',', decimal: '.' } )
}


covid_cohort_app.applyNumberStyle = function( value ){
  if( value === 'n/a' || value === false || value === 0 ){
    return 'zero'
  }
}

covid_cohort_app.applyCohortBackground = function( value ){
  let opacity = 0
  if( Number.isFinite( value ) && value > 0 ){
    opacity = value / 100
  }
  // Green gradient
  let backgroundColor = 'rgba(54,171,80,' + opacity + ')' // Seems we don't need to specify it's for background
  return { backgroundColor }
}

covid_cohort_app.launchGrid = function(){
  covid_cohort_app.gridOptions = covid_cohort_app.setGridOptions()

  // lookup the container we want the Grid to use
  var eGridDiv = document.querySelector('#cohortGrid')

  // create the grid passing in the div to use together with the columns & data we want to use
  new agGrid.Grid(eGridDiv, covid_cohort_app.gridOptions )
}


covid_cohort_app.datasetAnalysis = {
  firstCohort: {}
}
covid_cohort_app.analyseGeneralCasesData = function(){
  covid_cohort_app.originData.forEach( function( oneCase ){
    let caseAttributes = oneCase.attributes

    let caseCohortData = covid_cohort_app.readCaseCohort( caseAttributes )

    if( !covid_cohort_app.datasetAnalysis.firstCohort.caseCohort || covid_cohort_app.datasetAnalysis.firstCohort.caseCohort > caseCohortData.caseCohort ){
      covid_cohort_app.datasetAnalysis.firstCohort = caseCohortData
    }
  } )
}


covid_cohort_app.findMaxRelativeDay = function(){
  return moment().diff( covid_cohort_app.datasetAnalysis.firstCohort.caseCohortMoment, 'days' )
}





covid_cohort_app.readCaseCohort = function( caseAttributes ){
  let parsedAttributes = {}
  parsedAttributes.caseCohortMoment = moment( caseAttributes.Date_of_Co )
  parsedAttributes.caseCohort = parsedAttributes.caseCohortMoment.format( 'YYYY-MM-DD' )
  return parsedAttributes
}


covid_cohort_app.calculateTotals = function(){
  covid_cohort_app.totals = {
    count: 0,
    resolved: 0,
    Discharged: 0,
    Deceased: 0,
    Hospitalised: 0
  }

  covid_cohort_app.cases.forEach( function( oneCase ){
    covid_cohort_app.totals.count ++
    covid_cohort_app.totals.resolved += ( oneCase.parsed.isResolved )? 1:0
    covid_cohort_app.totals.Discharged += oneCase.parsed.caseStatus === 'Discharged'? 1:0
    covid_cohort_app.totals.Deceased += oneCase.parsed.caseStatus === 'Deceased'? 1:0
    covid_cohort_app.totals.Hospitalised += oneCase.parsed.caseStatus === 'Hospitalised'? 1:0
  } )

  // Pct
  covid_cohort_app.totals.resolved / covid_cohort_app.totals.count
  covid_cohort_app.totals.Discharged / covid_cohort_app.totals.count
  covid_cohort_app.totals.Deceased / covid_cohort_app.totals.count
  covid_cohort_app.totals.Hospitalised / covid_cohort_app.totals.count
}



covid_cohort_app.cohortTotalValueGetter = function( params ){
  let paramName = params.colDef.app.property
  if( params.node.rowPinned ){
    // Footer Rows
    if( params.data.totalsToShow.includes( paramName ) ){
      return covid_cohort_app.totals[ paramName ]
    }else{
      return 'n/a'
    }
  }else{
    // Cohort Rows
    return params.data[paramName]
  }
}

covid_cohort_app.cohortTotalFormatter = function( params ){

  if( Number.isFinite( params.value ) ){
    return covid_cohort_app.formatNumber( params.value )
  }else{
    return params.value
  }
}

covid_cohort_app.cohortTotalCellClass = function( params ){
  let classes = [ 'align-right']
  classes.push( covid_cohort_app.applyNumberStyle( params.value ) )
  return classes
}


covid_cohort_app.cohortTotalPctValueGetter = function( params ){
  let paramName = params.colDef.app.property
  if( params.node.rowPinned ){
    if( params.data.totalsToShow.includes( paramName ) ){
      return 100 * covid_cohort_app.totals[ paramName ] / covid_cohort_app.totals[ params.data.pctDenominator ]
    }else{
      return 'n/a'
    }
  }else{
    return 100 * params.data[paramName] / params.data.count
  }
}

covid_cohort_app.cohortTotalPctFormatter = function( params ){
  let numberDecimals = params.node.rowPinned? 1 : 0
  return covid_cohort_app.formatPct( params.value, numberDecimals )
}



covid_cohort_app.optionChoices = {
  age: [
    { 
      id: '0to30',
      label: '<30y old',
      values: [0,29]
    }
    ,{ 
      id: '30-59',
      label: '30-59y old',
      values: [30,59]
    }
    ,{ 
      id: '60+',
      label: '>60y old',
      values: [60,999]
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