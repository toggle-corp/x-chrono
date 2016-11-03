var database = firebase.database();

var dbListener = null;
var projects = {};
var tasks = [];

function addDBListener() {
    if (dbListener)
        return;

    // User listener for firebase database
    dbListener = function(snapshot) {
        var user = snapshot.val();
        var ps = user.projects;

        // Fetch projects for this user
        if (ps) {
            for (var p in ps) {
                var project = ps[p];
                var ts = project.tasks;

                projects[p] = project.title;

                // Fetch tasks for this project
                if (ts) {
                    for (var t in ts) {
                        var task = ts[t];
                        
                        var newTask = {
                            project: p,
                            title: task.title,
                            times: []
                        };
                        
                        var times = task.times;
                        if (times) {
                            for (var tm in times) {
                                var time = times[tm];

                                var newTime = {
                                    start_time: new Date(time.start_time),
                                };

                                if (time.end_time < time.start_time) {
                                    newTime["active"] = true;
                                } else {
                                    newTime["active"] = false;
                                    newTime["end_time"] = new Date(time.end_time);
                                }
                            }
                        }

                        tasks.push(newTask);
                    }
                }
            }
        }
        console.log(tasks);
    }

    var userRef = database.ref("users/" + currentUser.uid);
    userRef.on("value", dbListener);
}


function addProject(projectTitle) {
    var projectsRef = database.ref("user/" + currentUser.uid + "/projects");
    var project = projectsRef.push();
    project.set({
        title: projectTitle
    });

    return project.key;
}


function addTask(projectId, taskInfo) {
    var tasksRef = database.ref("user/" + currentUser.uid + "/projects/"
        + projectId + "/tasks");
    var task = tasksRef.push();
    task.set({
        info: taskInfo
    });

    return task.key();
}


function startTask(projectId, taskId, startTime) {
    var timesRef = database.ref("user/" + currentUser.uid + "/projects/"
        + projectId + "/tasks/" + taskId + "/times");
    var time = timesRef.push();
    time.set({
        start_time: startTime,
        end_time: 0
    });

    return time.key();
}


function updateTask(projectId, taskId, timeId, startTime, endTime) {
    var timeRef = database.ref("user/" + currentUser.uid + "/projects/"
        + projectId + "/tasks/" + taskId + "/times/" + timeId);
    timeRef.set({
        start_time: startTime,
        end_time: endTime
    });

    return timeId;
}

