function refreshDashboard() {
    // Start fetching database
    addDBListener();

    $("#username").html(currentUser.displayName);
}

refreshTasks = function() {
    $('#preload').slideUp('fast', function(){
        $('header').slideDown();
        $('main').fadeIn();
    });

    var taskTemplate = $(".task-template");
    var timeTemplate = $(".time-template");
    var taskContainer = $("#task-list")

    taskContainer.empty();

    for(var i=0; i < tasks.length; i++){
        var task = taskTemplate.clone();
        var currentTask = tasks[i];
        task.removeClass("task-template");
        task.addClass("task");

        task.find("h3").text(currentTask.title);
        task.find("p").text(projects[currentTask.project]);

        var timeContainer = task.find('.time-list');
        var active = null;
        for(var j=0; j < currentTask.times.length; j++){
            var startTime = currentTask.times[j].start_time;
            var endTime = currentTask.times[j].end_time;
            var time = timeTemplate.clone();
            time.removeClass('time-template');
            time.addClass('time');
            time.find('date').text(startTime.toLocaleString());

            if (currentTask.times[j].active) {
                time.find(".duration").text('active');
                active = currentTask.times[j];
            } else {
                time.find(".duration").text( ((endTime-startTime)/(1000*3600)).toFixed(2) + ' hrs' );
            }

            time.find('.delete-btn').click(function(pid, tid, tmid) {
                return function() {
                    if (confirm("Are you sure?"))
                        deleteTime(pid, tid, tmid);
                }
            } (currentTask.project, currentTask.id, currentTask.times[j].id));

            time.appendTo(timeContainer);
            time.show();
        }

        if (active) {
            task.find('.btn-start').text("Stop");
            task.find('.btn-start').click(function(pid, tid, tmid, st, et) {
                return function() {
                    updateTask(pid, tid, tmid, st, et);
                }
            }(currentTask.project, currentTask.id, active.id,
              active.start_time.getTime(), new Date().getTime()));
        }
        else {
            task.find('.btn-start').text("Start");
            task.find('.btn-start').click(function(pid, tid, tmid) {
                return function() {
                    startTask(pid, tid, tmid);
                };
            }(currentTask.project, currentTask.id, new Date().getTime()));
        }

        task.find('.btn-delete').click(function(pid, tid) {
            return function() {
                if (confirm("Are you sure you want to delete this task?"))
                    deleteTask(pid, tid);
            }
        }(currentTask.project, currentTask.id));

        task.appendTo(taskContainer);
        task.show();
    }

    if (projects) {
        var projectListContainer = $('#project-list');
        projectListContainer.empty();

        var projectSelect = $("#project-select");

        var projectTemplate = $('<a href="#" class="project"></a>');
        for(var pid in projects){
            var project = projectTemplate.clone();
            var currentProject = projects[pid];
            project.text(currentProject);
            project.appendTo(projectListContainer);

            $('<option value="' + pid + '">' + currentProject + '</option>')
                .appendTo(projectSelect);
        }
    }


    $("#add-project-btn").click(function() {
        var title = $("#new-project-title-input").val();
        $("#new-project-title-input").val("");
        addProject(title);
    });

    $("#add-task-modal-btn").click(function() {
        var title = $("#task-title-input").val();
        var pid = $("#project-select").val();
        $("#task-title-input").val("");
        addTask(pid, title);
    });
}
