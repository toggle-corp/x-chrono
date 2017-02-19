
let auth = {
    init: function($scope, $http) {
        $scope.auth = this;
        that = this;
        return new Promise(function(resolve, reject) {

            // First get current user and if not found, invoke sign in with redirect
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    that.user = user;
                    that.userId = user.uid;

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
                            reject("Cannot save user info to database\n" + JSON.stringify({response: response}))
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
                that.user = result.user;
                if (result.user) {
                    that.userId = result.user.uid;
                }
            }).catch(function(error) {
                let errorCode = error.code;
                let errorMessage = error.message;
                let email = error.email;
                let credential = error.credential;

                reject("Error\n" + "Code:" + errorCode + "\n" + "Message: " + errorMessage);
            });

        });
    }
};
