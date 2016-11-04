function refreshDashboard() {
    // Start fetching database
    addDBListener();

    $("#username").html(currentUser.displayName);
}

refreshTasks = function() {
    $('#preload').slideUp('fast', function(){
        $('header').slideDown();
        $('main').fadeIn('slow', function(){
            showTab($('#tab-tasks'));
        });
    });

    var taskTemplate = $(".task-template");
    var timeTemplate = $(".time-template");
    var taskContainer = $("#task-list .row")

    taskContainer.empty();

    for(var i=0; i < tasks.length; i++){
        var task = taskTemplate.clone();
        var currentTask = tasks[i];
        task.removeClass("task-template");
        //task.addClass("task");

        task.find("h3").text(currentTask.title);
        task.find("p").text(projects[currentTask.project].title);

        var timeContainer = task.find('.time-list');
        var active = null;
        if(currentTask.times.length == 0){
            $('<p class="empty-text">No time data found</p>').appendTo(timeContainer);
        }
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

            time.find('.delete-btn').unbind().click(function(pid, tid, tmid) {
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
            task.find('.btn-start').unbind().click(function(pid, tid, tmid, st, et) {
                return function() {
                    updateTask(pid, tid, tmid, st, et);
                }
            }(currentTask.project, currentTask.id, active.id,
              active.start_time.getTime(), new Date().getTime()));
        }
        else {
            task.find('.btn-start').text("Start");
            task.find('.btn-start').unbind().click(function(pid, tid, tmid) {
                return function() {
                    startTask(pid, tid, tmid);
                };
            }(currentTask.project, currentTask.id, new Date().getTime()));
        }

        task.find('.btn-delete').unbind().click(function(pid, tid) {
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
            project.text(currentProject.title);
            project.appendTo(projectListContainer);

            $('<option value="' + pid + '">' + currentProject.title + '</option>')
                .appendTo(projectSelect);
        }
    }


    $("#add-project-btn").unbind().click(function() {
        var title = $("#new-project-title-input").val();
        if (title == "")
            return;
        $("#new-project-title-input").val("");
        addProject(title);
    });

    $("#add-task-modal-btn").unbind().click(function() {
        var title = $("#task-title-input").val();
        if (title == "")
            return;
        var pid = $("#project-select").val();
        if (!pid || pid == "")
            return;
        $("#task-title-input").val("");
        addTask(pid, title);
    });

    function showTab(tab){
        var tabBar = tab.parent().find('.tab-active-bar');
        tabBar.animate({
            left: parseInt(tab.position().left)+'px',
            width: parseInt(tab.innerWidth())+'px'
        });
        $('.tab-content').hide();
        $(tab.data('target')).fadeIn();
    }

    $('.tab').on('click', function(){
        showTab($(this));
    });
}
