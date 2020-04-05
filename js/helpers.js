
var covid_cohort_app = covid_cohort_app || {}


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
