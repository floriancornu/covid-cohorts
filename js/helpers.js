
var covid_cohort_app = covid_cohort_app || {}
console.log( 'helpers' )


covid_cohort_app.formatPct = function( value ){
  return accounting.formatMoney( value, { symbol: '%', format: '%v%s', precision: 0, thousands: ',', decimal: '.' } )
}

covid_cohort_app.applyNumberStyle = function( value ){
  if( value === false || value === 0 ){
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