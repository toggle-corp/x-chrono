var database = firebase.database();

var userListener = null;
var teamsListener = {};

var projects = {};
var tasks = [];

var teams = {};

var refreshTasks;

function addDBListener() {
    if (userListener)
        return;

    var userRef = database.ref("users/" + currentUser.uid);
    userRef.child("username").set(currentUser.displayName);
    userRef.child("email").set(currentUser.email);
    userRef.child("avatar").set(currentUser.photoURL);

    // User listener for firebase database
    userListener = function(snapshot) {
        tasks = [];
        projects = {};
        teams = {};
        teamsListener = {};
        // TODO remove old listeners

        var user = snapshot.val();
        var ps = user.projects;

        // Fetch projects for this user
        if (ps) {
            for (var p in ps) {
                var project = ps[p];
                var ts = project.tasks;

                projects[p] = {
                    title: project.title,
                    team: project.team,
                    created_at: project.created_at
                };

                // Fetch tasks for this project
                if (ts) {
                    for (var t in ts) {
                        var task = ts[t];

                        var newTask = {
                            id: t,
                            project: p,
                            title: task.title,
                            times: [],
                            created_at: task.created_at,
                            team: task.team
                        };

                        var times = task.times;
                        if (times) {
                            for (var tm in times) {
                                var time = times[tm];

                                var newTime = {
                                    id: tm,
                                    start_time: new Date(time.start_time),
                                };

                                if (time.end_time < time.start_time) {
                                    newTime["active"] = true;
                                } else {
                                    newTime["active"] = false;
                                    newTime["end_time"] = new Date(time.end_time);
                                }

                                newTask.times.push(newTime);
                            }
                        }

                        newTask.times.sort(function(t1, t2) {
                            return t2.start_time - t1.start_time;
                        });
                        tasks.push(newTask);
                    }
                }
            }
        }

        tasks.sort(function(t1, t2) {
            return t2.created_at - t1.created_at;
        });

        // Next fetch each team data
        if (user.teams) {
            for (var teamId in user.teams) {
                if (teamsListener[teamId])
                    continue;

                teamsListener[teamId] = function(teamId) {
                    return function(teamSnapshot) {
                        if (teamSnapshot.exists()) {
                            var team = teamSnapshot.val();
                            // Create new team structure
                            teams[teamId] = { projects: {}, name: team.name };
                            // Get each project for this team
                            for (var pid in team.projects) {
                                var projectTasks = {};

                                teams[teamId].projects[pid] = {
                                    title: team.projects[pid].title,
                                    tasks: projectTasks
                                };

                                // Get each task for this project
                                for (var tid in team.projects[pid].tasks) {
                                    projectTasks[tid] = {
                                        title: team.projects[pid].tasks[tid].title
                                    };
                                }
                            }
                        }

                        if (refreshTasks)
                            refreshTasks();
                    };
                }(teamId);
                database.ref("teams/" + teamId).on('value', teamsListener[teamId]);
            }
        }

        if (refreshTasks)
            refreshTasks();
    }

    userRef.on("value", userListener);
}

function addProject(teamId, projectTitle) {
    // If team doesn't have project with this title, add in the team too
    var teamPid = null;
    for (var pid in teams[teamId].projects) {
        if (teams[teamId].projects[pid].title == projectTitle) {
            teamPid = pid;
            break;
        }
    }
    if (!teamPid) {
        var p = database.ref("teams/" + teamId + "/projects").push();
        p.set({
            title: projectTitle
        });
        teamPid = p.key;
    }

    // Now add for user
    var projectsRef = database.ref("users/" + currentUser.uid + "/projects");
    var project = projectsRef.push();
    project.set({
        title: projectTitle,
        created_at: new Date().getTime(),
        team: teamId + ':' + teamPid
    });

    return project.key;
}


function addTask(projectId, taskTitle) {
    // Also add task in the team project, so others can add similar task
    // Add only if task is not in the team project

    // First find team project
    var tids = projects[projectId].team.split(':');
    var teamProject = teams[tids[0]].projects[tids[1]];

    // Next find and add task in team
    var teamTid = null;
    for (var tid in teamProject.tasks) {
        if (teamProject.tasks[tid].title == taskTitle) {
            teamTid = tid;
            break;
        }
    }
    if (!teamTid) {
        var t = database.ref("teams/" + tids[0] + "/projects/" + tids[1] + "/tasks").push();
        t.set({
            title: taskTitle
        });
        teamTid = t.key;    
    }

    // Now add for user
    var tasksRef = database.ref("users/" + currentUser.uid + "/projects/"
        + projectId + "/tasks");
    var task = tasksRef.push();
    task.set({
        title: taskTitle,
        created_at: new Date().getTime(),
        team: teamTid
    });

    return task.key;
}


function startTask(projectId, taskId, startTime) {
    var timesRef = database.ref("users/" + currentUser.uid + "/projects/"
        + projectId + "/tasks/" + taskId + "/times");
    var time = timesRef.push();
    time.set({
        start_time: startTime,
        end_time: 0
    });

    return time.key;
}


function updateTask(projectId, taskId, timeId, startTime, endTime) {
    var timeRef = database.ref("users/" + currentUser.uid + "/projects/"
        + projectId + "/tasks/" + taskId + "/times/" + timeId);
    timeRef.set({
        start_time: startTime,
        end_time: endTime
    });

    return timeId;
}


function deleteTask(projectId, taskId) {
    var tids = projects[projectId].team.split(':');
    tids.push(tasks.filter(function(t){
        return t.id == taskId && t.project == projectId;
    })[0].team);
    database.ref("teams/" + tids[0] + "/projects/" + tids[1]
        + "/tasks/" + tids[2]).remove();

    database.ref("users/" + currentUser.uid + "/projects/" + projectId
        + "/tasks/" + taskId).remove();
}

function deleteTime(projectId, taskId, timeId) {
    database.ref("users/" + currentUser.uid + "/projects/" + projectId
        + "/tasks/" + taskId + "/times/" + timeId).remove();
}

function deleteProject(projectId) {
    database.ref("users/" + currentUser.uid + "/projects/" + projectId)
        .remove();
}
