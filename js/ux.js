
var covid_cohort_app = covid_cohort_app || {}


// Show the filters
covid_cohort_app.showFilters = function(){
  let divId

  // Age
  divId = 'filter-age'
  buttonArea = document.getElementById( divId )
  covid_cohort_app.optionChoices.age.forEach( function( oneOption ){
    let button = document.createElement( 'button' )
    button.classList.add( 'btn' )
    button.classList.add( 'btn-primary' )
    button.setAttribute( 'type', 'button' )
    button.setAttribute( 'optionId', oneOption.id )
    button.setAttribute( 'optionType', 'age' )
    button.innerText = oneOption.label
    buttonArea.append( button )
  } )
  buttonArea.addEventListener( 'click', function( event ){
    console.log( 'clicked', event )
    console.log( event.target )
    let optionId = event.target.getAttribute( 'optionId' )
    let optionType = event.target.getAttribute( 'optionType' )
    console.log( optionType, optionId )
    covid_cohort_app.options[ optionType ] = optionId

    covid_cohort_app.showFilterActives()
    covid_cohort_app.read_cases()
  } )


  // Gender
  divId = 'filter-gender'
  buttonArea = document.getElementById( divId )
  covid_cohort_app.optionChoices.gender.forEach( function( oneOption ){
    let button = document.createElement( 'button' )
    button.classList.add( 'btn' )
    button.classList.add( 'btn-primary' )
    button.setAttribute( 'type', 'button' )
    button.setAttribute( 'optionId', oneOption.id )
    button.setAttribute( 'optionType', 'gender' )
    button.innerText = oneOption.label
    buttonArea.append( button )
  } )
  buttonArea.addEventListener( 'click', function( event ){
    console.log( 'clicked', event )
    console.log( event.target )
    let optionId = event.target.getAttribute( 'optionId' )
    let optionType = event.target.getAttribute( 'optionType' )
    console.log( optionType, optionId )
    covid_cohort_app.options[ optionType ] = optionId

    covid_cohort_app.showFilterActives()

    covid_cohort_app.read_cases()
  } )

  // Initial active states
  covid_cohort_app.showFilterActives()
}


covid_cohort_app.showFilterActives = function(){
  let optionName

  function updateActive( optionName ){
    document.querySelectorAll( 'button[optiontype="' + optionName + '"]' ).forEach( function( oneNode ){
      oneNode.classList.remove( 'active' )
    } )
    document.querySelector( 'button[optiontype="' + optionName + '"][optionid="' + covid_cohort_app.options[ optionName ] + '"]' ).classList.add( 'active' )
  }

  optionName = 'age'
  updateActive( optionName )

  optionName = 'gender'
  updateActive( optionName )
  

  // document.querySelector( 'button[optiontype="gender"]' ).classList.remove( 'active' )
  // document.querySelector( 'button[optiontype="gender"][optionid="' + covid_cohort_app.options[ 'gender' ] + '"]' ).classList.add( 'active' )
}

