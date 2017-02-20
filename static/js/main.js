
var chrono = angular.module('chrono', []);

chrono.controller('mainController',  ['$scope', '$http', function($scope, $http) {

    // CSRF handling for angular post/put/delete requests
    $http.defaults.xsrfCookieName = 'csrftoken';
    $http.defaults.xsrfHeaderName = 'X-CSRFToken';

    // Try signing in
    auth.init($scope, $http).then(function() {
        // We are now signed in
        // Do everything here

        database.init($scope, $http);
        return database.loadAll().then(function() {
            $scope.selectedTeam = database.teams[0].teamId;
            $scope.$apply();
        });
    }).catch(function(error) {
        console.log(error);
    });
}]);
