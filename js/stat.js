
var projects = {};
var users = {};

function refreshStat() {
    for (var projectTitle in projects) {
        var project = projects[projectTitle];

        for (var pinfo in project) {
            var user = users[pinfo.uid];
        }
    }
}


var database = firebase.database();
var dbListener = function(snapshot) {
    users = [];
    projects = {};

    users = snapshot.val();
    if (users) {
        for (var u in users) {
            var user = users[u];
            var uProjects = user.projects;
            if (uProjects) {
                for (var p in uProjects) {
                    var project = uProjects[p];

                    if (!projects[project.title]) {
                        projects[project.title] = [];
                    }

                    projects[project.title].push({
                        id: p,
                        uid: u
                    });
                }
            }
        }
    }

    refreshStat();
}
database.ref("users").on("value", dbListener);