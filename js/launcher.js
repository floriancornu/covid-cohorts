

var covid_cohort_app = covid_cohort_app || {}


// Launch Option Filters

covid_cohort_app.readDataFromSeveralFiles().then( function(){ // multiple files
// covid_cohort_app.readData().then( function(){ // 1 file only
  covid_cohort_app.analyseGeneralCasesData()
  covid_cohort_app.launchGrid()
  covid_cohort_app.read_cases()

  covid_cohort_app.showFilters()
})
