
let auth = {
    init: function($scope, $http) {
        $scope.auth = {};
        return new Promise(function(resolve, reject) {

            // First get current user and if not found, invoke sign in with redirect
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    $scope.auth.user = user;

                    // Before doing anything, save/update the user in the database
                    // Save user details to db
                    let userData = {
                        userId: user.uid,
                        displayName: user.displayName,
                        photoUrl: user.photoURL,
                        email: user.email
                    };

                    $http.post(userApi, userData).then(
                        function success(response) {
                            // user-primary-key: response.data.data.userPk
                            resolve();
                		},
                        function error(response) {
                            reject("Cannot save user info to database\n" + JSON.stringify({data: error}))
                		}
                    );
                }
                else {
                    var provider = new firebase.auth.GoogleAuthProvider();
                    firebase.auth().signInWithRedirect(provider);
                }
            });

            // Next handle the redirect result in case of error
            firebase.auth().getRedirectResult().then(function(result) {
                this.user = result.user;
            }).catch(function(error) {
                let errorCode = error.code;
                let errorMessage = error.message;
                let email = error.email;
                let credential = error.credential;

                reject("Error\n" + "Code:" + errorCode + "\n" + "Message: " + errorMessage);
            });

        });
        let provider = new firebase.auth.GoogleAuthProvider();
    }
};
