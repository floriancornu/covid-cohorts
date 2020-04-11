
var covid_cohort_app = covid_cohort_app || {}



var count = 0

covid_cohort_app.cohortDataValueGetter = function( params ){
  let isDebugging = false

  let cohortDischargedCasesToDate = 0
  let columnRelativeDays = params.colDef.app.relativeDays
  let cohortAge = params.data.cohortAge
  let cohortDate = params.data.cohort
  
  if( cohortAge < columnRelativeDays ){
    return false
  }

  if( count > 10 ){ 
    isDebugging = false
  }
  count ++

  if( isDebugging ) console.log( cohortAge, columnRelativeDays,  params )

  covid_cohort_app.cases.forEach( function( oneCase ){
    // is case within cohort?
    let isCaseWithinCohort = oneCase.parsed.caseCohort === cohortDate

    // case discharged within days
    let isCaseDischarged = ( Number.isFinite( oneCase.parsed.caseDischargeAfterDays ) && oneCase.parsed.caseDischargeAfterDays <= columnRelativeDays )

    // is Case Discharged (otherwise discharge date is for death)
    let isCaseAboutDischarged = oneCase.parsed.Status === 'Discharged'

    if( isDebugging ) console.log( isCaseWithinCohort, isCaseDischarged, isCaseAboutDischarged )

    if( isCaseWithinCohort && isCaseDischarged && isCaseAboutDischarged ){
      cohortDischargedCasesToDate ++
    }
  } )

  if( covid_cohort_app.tableValues === 'number' ){
    return cohortDischargedCasesToDate
  }else{
    return 100 * cohortDischargedCasesToDate / params.data.count
  }
}