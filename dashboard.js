function refreshDashboard() {
    // Start fetching database
    addDBListener();

    $("#username").html("Welcome " + currentUser.displayName + " !");
}