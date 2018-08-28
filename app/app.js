var app=angular.module('TakersApp', ['ngRoute', 'ui.bootstrap', 'ngDialog', 'angular-popover']);

// register the interceptor as a service
app.factory('HttpInterceptor', ['$q', '$rootScope', function($q, $rootScope) {
       return {
            // On request success
            request : function(config) {
                // Return the config or wrap it in a promise if blank.
                return config || $q.when(config);
            },

            // On request failure
            requestError : function(rejection) {
                //console.log(rejection); // Contains the data about the error on the request.  
                // Return the promise rejection.
                return $q.reject(rejection);
            },

            // On response success
            response : function(response) {
                //console.log(response); // Contains the data from the response.
                // Return the response or promise.
                return response || $q.when(response);
            },

            // On response failure
            responseError : function(rejection) {
                //console.log(rejection); // Contains the data about the error.
                //Check whether the intercept param is set in the config array. 
                //If the intercept param is missing or set to true, we display a modal containing the error
                if (typeof rejection.config.intercept === 'undefined' || rejection.config.intercept)
                {
                    //emitting an event to draw a modal using angular bootstrap
                    $rootScope.$emit('errorModal', rejection.data);
                }

                // Return the promise rejection.
                return $q.reject(rejection);
            }
        };
 }]);

app.config(function($routeProvider, $httpProvider, ngDialogProvider){


    $httpProvider.defaults.cache = false;
    if (!$httpProvider.defaults.headers.get) {
		$httpProvider.defaults.headers.get = {};
    }
	
    // disable IE ajax request caching
    $httpProvider.defaults.headers.get['If-Modified-Since'] = '0';

	ngDialogProvider.setDefaults({
		className: 'ngdialog-theme-default',
		plain: false,
		showClose: true,
		closeByDocument: true,
		closeByEscape: true,
		appendTo: false,
		preCloseCallback: function () {
			console.log('default pre-close callback');
		}
	});

    //$httpProvider.requestInterceptors.push('httpRequestInterceptorCacheBuster');
 

	// Add the interceptor to the $httpProvider to intercept http calls
	$httpProvider.interceptors.push('HttpInterceptor');
  
    $routeProvider.when('/all-takers',
    {
      templateUrl: 'template/allTakers.html',
	  controller: 'ctrlAllTakers'
    })
    .when('/add-taker',
    {
      templateUrl: 'template/manageTaker.html',
      controller: 'ctrlAddTakers'
    }) 

	.when('/reports',
    {
      templateUrl: 'template/viewReports.html',
      controller: 'ctrlReports'
    }) 		
	
    .otherwise({redirectTo:'/all-takers'});  
});    




app.factory('httpInterceptor', function ($q, $rootScope, $log) {

    var numLoadings = 0;

    return {
        request: function (config) {

            numLoadings++;

            // Show loader
            $rootScope.$broadcast("loader_show");
            return config || $q.when(config)

        },
        response: function (response) {

            if ((--numLoadings) === 0) {
                // Hide loader
                $rootScope.$broadcast("loader_hide");
            }

            return response || $q.when(response);

        },
        responseError: function (response) {

            if (!(--numLoadings)) {
                // Hide loader
                $rootScope.$broadcast("loader_hide");
            }

            return $q.reject(response);
        }
    };
})
app.config(function ($httpProvider) {
    $httpProvider.interceptors.push('httpInterceptor');
});


app.directive("loader", function ($rootScope) {
    return function ($scope, element, attrs) {
        $scope.$on("loader_show", function () {
            return element.show();
        });
        return $scope.$on("loader_hide", function () {
            return element.hide();
        });
    };
}
)

// PASS TEXT VARIABLE BETWEEN CONTROLLERS
app.factory('MyTextSearch', function() {
	// private
	var value = '';

	// public
    return {
		getValue: function() {
			return value;
		},
		
		setValue: function(val) {
			value = val;
		}
	};
})
	  
app.controller('ctrlAllTakers', function ($scope, $timeout, MyTextSearch, TakerService, ngDialog){

	// LOAD TAKERS
	TakerService.getTakers().success(function(allTakers, status, header, config){
		console.log("query getTakers OK");        
		console.log(allTakers);        
		var length = allTakers.length;
				$scope.allTakers = allTakers;	
				$scope.takerChampTri='lastname';
				
                $scope.takerSelIdx= -1;
                $scope.selIdx= -1;

                $scope.selTaker=function(taker,idx){
                    $scope.selectedTaker=taker;
                    $scope.selIdx=idx;
					window.location="#/view-taker/" + idx;
                }

                $scope.isSelTaker=function(taker){
                    return $scope.selectedTaker===taker;
                }			
		
		$scope.TakersNumber = allTakers.length + " takers registered";		

		$scope.isSelTaker=function(allTakers){
			return $scope.selectedTaker===allTakers;
		}	
		
	})
	.error(function (data, status, header, config) {
		console.log("query getTakers ERROR");              				
		console.log("status: " + status);
		if (status==302) {
			console.log("Session expired - New Authentication requested");
		}
		if (status==0) {
			// NGDIALOG BOX
			var dialog = ngDialog.open({
				template: '<p>Your session expired - The page needs to be reloaded.<br />Please note that data enter in the form will be lost</p>',
				plain: true,
				closeByDocument: false,
				closeByEscape: false
			});
			setTimeout(function () {
				dialog.close();
				window.location = "";		
			}, 3000);
														
		}					
	})
	.finally(function() {
	  console.log("getTakers finished");
	});							

	
	// recherche

	$scope.searchText = null;
	$scope.razRecherche = function() {
		$scope.searchText = null;
		console.log("RAZ");
		MyTextSearch.setValue('');
		$scope.contacts=null;
	}	

	// tri

	$scope.champTri = null;
	$scope.triDescendant = false;
	$scope.takersSort = function(champ) {
		if ($scope.champTri == champ) {
			$scope.triDescendant = !$scope.triDescendant;
		} else {
			$scope.champTri = champ;
			$scope.triDescendant = false;
		}	
	}


	$scope.cssChevronsTri = function(champ) {
		return {
			glyphicon: $scope.champTri == champ,
			'glyphicon-chevron-up' : $scope.champTri == champ && !$scope.triDescendant,
			'glyphicon-chevron-down' : $scope.champTri == champ && $scope.triDescendant 
		};
	}	
	
	$scope.confirmDelTaker = function (idTaker) {
		if(confirm('Do you want to delete this taker?')){
				
			// To do
				
		}else{window.location="#/all-takers";}
		

	};		
	
	
});

app.controller('NavbarController', function($scope, $location){

	$scope.getClass=function(path){
		
		if($location.path().substr(0,path.length) == path){
			return true;
		}else{
			return false;
		}
		
	}
});



app.controller('ctrlAddTakers', function ($scope, $route, MyTextSearch, ngDialog, $timeout){
	// To do
});

app.controller('ctrlReports', function ($scope, $routeParams, $rootScope, MyTextSearch, ngDialog, $timeout){	
	// To implement if necessary	
});
