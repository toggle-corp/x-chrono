
var chrono = angular.module('chrono', []);

chrono.controller('mainController',  ['$scope', '$http', function($scope, $http) {

    // CSRF handling for angular post/put/delete requests
    $http.defaults.xsrfCookieName = 'csrftoken';
    $http.defaults.xsrfHeaderName = 'X-CSRFToken';

    $scope.mainSpinnerVisible = true;

    // Try signing in
    auth.init($scope, $http).then(function() {
        // We are now signed in
        // Do everything here

        database.init($scope, $http);
        return database.loadAll().then(function() {
            $scope.mainSpinnerVisible = false;
            $scope.selectedTeam = database.teams[0].teamId;
            $scope.$apply();
        });
    }).catch(function(error) {
        console.log(error);
    });
}]);


function progressClick(element, promise) {
    element = angular.element(element);
    if (element.data('inprogress')) {
        return;
    }
    element.data('inprogress', true);

    let oldContent = element.html();
    let done = function() {
        element.html(oldContent);
        element.data('inprogress', false);
    };

    element.html('<i class="fa fa-spinner fa-spin"></i>');
    return promise.then(() => {
        done();
    }).catch((error) => {
        done();
        console.log(error);
    });
}

chrono.directive('progressClick', function() {
    return {
        restrict: 'A',
        scope: {
            progressClick: '&',
        },
        link: function(scope, element, attr) {
            element.on('click', function() {
                progressClick(element, scope.progressClick());
            });
        },
    };
});
