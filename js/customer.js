		   
	    //////////////////////////////////////
	   //    Train Composition Viewer      //
	  //  Created by Zhen on 19.07.2017   //
	 //////////////////////////////////////




$(document).ready(function(){

	const jsonStation = 'https://rata.digitraffic.fi/api/v1/metadata/stations';
	const jsonOperator = 'https://rata.digitraffic.fi/api/v1/metadata/operators';

	function currentDate() {
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth()+1; //January is 0!
		var yyyy = today.getFullYear();

		if(dd<10) {dd = '0'+dd} 
		if(mm<10) {mm = '0'+mm} 

		return yyyy + '-' + mm + '-' + dd; //2018-04-08
	}


	function currentTime() {
	    var d = new Date();
	    return d.getHours() + ':' + d.getMinutes() + ':' + '00';
	}

	$('#trainInfoCard').hide();
	$('#divnotFound').hide();
	$('#divCancelled').hide();

	$('#search').keyup(function(){  //each time release keyboard		
		$('#result').html('');  //set result as html

		var searchField = $('#search').val();  //assign value of input
		var expression = new RegExp(searchField, 'i');

		$.getJSON(jsonStation, function(data){			
			$.each(data, function(key, value){
				if(value.stationShortCode.search(expression) != -1 || value.stationName.search(expression) != -1 ){
					// returns -1 if no match is found
					$('#result').append('<li class="list-group-item">' + value.stationShortCode + ' / ' + value.stationName + '</li>');		
				}
			})
		});
	})

	$('input').on('click focusin', function() {
    	this.value = '';
    	$('#trainNumberListCard').html('');
    	$('#trainInfoCard, #divnotFound').hide();
    	$('#listChangeSize').removeClass('col-sm-6');
    	$('#listChangeSize').addClass('col-sm-12');
	});

	$('#result').on('click', 'li', function() {
	    $('#search').val($(this).text()); //send val to search, eg: HKI/Helsinki
	    $('.passby-position').css('margin', '0 auto 10px auto');

	    var selectedText = $(this).text().split('/'); //get stationCode string for next json query
	    var selectedStation = selectedText[0]; 
	   
	    $("#result").html(''); //clear result list
	    
	

		//get info of this station from json
		var jsonTrainsAtStation = 'https://rata.digitraffic.fi/api/v1/live-trains?station=' + selectedStation;
		

		$('#trainNumberListCard').html('');
		
		$.getJSON(jsonTrainsAtStation, function(data){			
			
			$.each(data, function(key, value){  //get all train numbers at target station
				$('#trainNumberListCard').append('<div class="col-sm-3 col-md-4"><button class="btn btn-warning" id="' + value.trainNumber + '">' + value.trainType + value.trainNumber + '</button></div>');
			});	

			$('button').click(function() {	//click trainNumber btn, get json for this train, current date 
				
				$('#listChangeSize').removeClass('col-sm-12');
				$('#listChangeSize').addClass('col-sm-6');
				$('#trainInfoCard').addClass('col-sm-6');

				var clickedTrain = this.id;

				var jsonTrainCompInfo = 'https://rata.digitraffic.fi/api/v1/compositions/' +
				currentDate() + '/' + clickedTrain;
				var jsonTrainSchInfo = 'https://rata.digitraffic.fi/api/v1/train-tracking/' +  
				currentDate() + '/' + clickedTrain;
				
				$.getJSON(jsonTrainSchInfo, function(data){					
					if (data.cancelled) {	//if train cancelled
						$('#divCancelled').show();
						$('#divnotFound').show();
	
						var operatorShortCode = data.operatorShortCode;
						$.getJSON(jsonOperator, function(data){		
							$.each(data, function(key, value){	
								if (value.operatorShortCode == operatorShortCode) {
									$('#operator').html(value.operatorName);
								}	
							});
						});	
					}
					else {
						$('#divCancelled').hide();
					}
				});	
				

				$.getJSON(jsonTrainCompInfo, function(data){

					//if composition info not found 
					if(data.code == 'COMPOSITION_NOT_FOUND') {
						$('#divnotFound').show();
						$('#trainInfoCard').hide();
					
					}
					else {

						$('#trainInfoCard').show();
						$('#divnotFound').hide();

						$('#route').html( 
						data.journeySections[0].beginTimeTableRow.stationShortCode +  '    &#10230;    ' +
						data.journeySections[0].endTimeTableRow.stationShortCode);

						$('#schedule').html( 
						(data.journeySections[0].beginTimeTableRow.scheduledTime).slice(11,-8) +  '    &#10230;    ' +
						(data.journeySections[0].endTimeTableRow.scheduledTime).slice(11,-8));


						$('#locomotive').html('<p>' + data.journeySections[0].locomotives[0].locomotiveType + ' ' + data.journeySections[0].locomotives[0].powerType + '</p>');
						$('#length').html('<p>' + data.journeySections[0].totalLength + ' m</p>');
						$('#maxSpeed').html('<p>' + data.journeySections[0].maximumSpeed + ' km/h</p>');
						
						$('#wagons').html('');
						for (var i = 0; i < data.journeySections[0].wagons.length; i++) {
							$('#wagons').append(data.journeySections[0].wagons[i].wagonType + ', ');
						}
						var wagons = $('#wagons').html().slice(0,-2); 
						$('#wagons').html(wagons); //delete the last element ',' in wagons list

						$('#version').html('<p>' + data.version + '</p>');
						var start = (data.journeySections[0].beginTimeTableRow.scheduledTime).slice(0,-5);
						var end = (data.journeySections[0].endTimeTableRow.scheduledTime).slice(0,-5);

						var current_data_time = currentDate() + 'T' + currentTime();
						if(current_data_time >= start && current_data_time <= end) {
							$('#status').html('<button id="movingBtn">MOVING</button>');
						}
						else {
							$('#status').html('<button id="stopBtn">STOP</button>');
						}
					}
				})
			})				
		})
	})
})

		

		
