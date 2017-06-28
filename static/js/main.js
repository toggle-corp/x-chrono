
const chrono = angular.module('chrono', []);
let editTeam = null;

const teamManager = {
    init() {
        this.modal = new Modal(document.getElementById('edit-team-modal'), progressClick);
    },

    edit() {
        this.modal.show((action) => {
            return new Promise((resolve, reject) => {
                resolve();
            });
        });
    },
};

chrono.controller('mainController',  ['$scope', '$http', function($scope, $http) {

    // CSRF handling for angular post/put/delete requests
    $http.defaults.xsrfCookieName = 'csrftoken';
    $http.defaults.xsrfHeaderName = 'X-CSRFToken';

    $scope.dataLoaded = false;
    $scope.phaseTab = { };
    $scope.teamId = teamId;

    $scope.getDashboardUrl = function(project) {
        return '/' + database.teams.find(t => t.pk == project.team).slug +
            '/' + project.slug + '/';
    };

    // Try signing in
    auth.init($scope, $http).then(function() {
        // We are now signed in
        // Do everything here

        database.init($scope, $http);
        return database.loadAll().then(function() {
            $scope.dataLoaded = true;
            $scope.team = database.teams[0];
            $scope.$apply();

            teamManager.init();
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

    element.html('<i class="fa fa-circle-o-notch fa-spin"></i>');
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
                let promise = scope.progressClick();
                if (promise) {
                    progressClick(element, promise);
                }
            });
        },
    };
});
