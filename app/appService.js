app.factory('TakerService', function($http){

	var factory={};
	
	factory.getTakers=function(){
		return $http.get("testtakers.json");
	
	};

	return factory;
	
})
