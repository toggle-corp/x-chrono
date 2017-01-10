var currentUser; 

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        currentUser = user;
        refreshDashboard();
    }
    else {
        var provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithRedirect(provider);
    }
});

firebase.auth().getRedirectResult().then(function(result) {
    // The signed-in user info.
    var user = result.user;
}).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;

    console.log("Error\n" + "Code:" + errorCode + "\n"
                + "Message: " + errorMessage);
});