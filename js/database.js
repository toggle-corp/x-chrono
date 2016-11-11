var database = firebase.database();

var dbListener = null;
var projects = {};
var tasks = [];

var refreshTasks;

function addDBListener() {
    if (dbListener)
        return;

    var userRef = database.ref("users/" + currentUser.uid);
    userRef.child("username").set(currentUser.displayName);
    userRef.child("email").set(currentUser.email);
    userRef.child("avatar").set(currentUser.photoURL);

    // User listener for firebase database
    dbListener = function(snapshot) {
        tasks = [];
        projects = {};
        var user = snapshot.val();
        var ps = user.projects;

        // Fetch projects for this user
        if (ps) {
            for (var p in ps) {
                var project = ps[p];
                var ts = project.tasks;

                projects[p] = {
                    title: project.title,
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
                            created_at: task.created_at
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

        if (refreshTasks)
            refreshTasks();
    }

    var userRef = database.ref("users/" + currentUser.uid);
    userRef.on("value", dbListener);
}


function addProject(projectTitle) {
    var projectsRef = database.ref("users/" + currentUser.uid + "/projects");
    var project = projectsRef.push();
    project.set({
        title: projectTitle,
        created_at: new Date().getTime()
    });

    return project.key;
}


function addTask(projectId, taskTitle) {
    var tasksRef = database.ref("users/" + currentUser.uid + "/projects/"
        + projectId + "/tasks");
    var task = tasksRef.push();
    task.set({
        title: taskTitle,
        created_at: new Date().getTime()
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
