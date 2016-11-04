google.charts.load('current', {'packages':['line', 'timeline']});
google.charts.setOnLoadCallback(drawChart);

var activeProject = null;
var chartLoaded = false;

function drawEmptyChart() {
    $('#line-chart-div').html("No data available for this project");
    $('#timeline-div').html("");
}

function drawChart() {
    chartLoaded = true;

    if (activeProject) {

        // First draw the line chart
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Day');

        for (var i in activeProject) {
            var info = activeProject[i];
            data.addColumn('number', users[info.uid].username);
        }

        var dates = [];
        for (var i in activeProject) {
            var info = activeProject[i];
            var keys = Object.keys(info.hours);
            for (var h in keys) {
                if (dates.indexOf(keys[h]) < 0)
                    dates.push(keys[h]);
            }
        }

        if (dates.length <= 0) {
            drawEmptyChart();
            return;
        }

        for (var d in dates) {
            var date = dates[d];
            var temp = [date];
            for (var i in activeProject) {
                if (activeProject[i].hours[date])
                    temp.push(activeProject[i].hours[date]);
                else
                    temp.push(0);
            }

            data.addRow(temp);
        }

        var lineChartOptions = {
            width: 900,
            height: 300
        };
        
        $("main").show();

        var lineChart = new google.charts.Line(document.getElementById('line-chart-div'));
        lineChart.draw(data, lineChartOptions);

        // Next draw the timeline
        var dataTable = new google.visualization.DataTable();
        dataTable.addColumn({type: 'string', id: 'Name'});
        dataTable.addColumn({type: 'string', id: 'Task'});
        dataTable.addColumn({type: 'date', id: 'Start'});
        dataTable.addColumn({type: 'date', id: 'End'});

        for (var i in activeProject) {
            var info = activeProject[i];
            var user = users[info.uid];
            var project = user.projects[info.id];

            if (project.tasks)
            for (var t in project.tasks) {
                var task = project.tasks[t];

                if (task.times)
                for (var tm in task.times) {
                    var time = task.times[tm];

                    if (time.start_time < time.end_time) {
                        var temp = [
                            users[info.uid].username,
                            task.title,
                            new Date(time.start_time),
                            new Date(time.end_time)
                        ];
                        dataTable.addRow(temp);
                    }
                }
            }
        }

        var timeline = new google.visualization.Timeline(document.getElementById('timeline-div'));
        timeline.draw(dataTable);
    }
}


var projects = {};
var users = {};

function refreshStat() {
    var projectsContainer = $('#project-list');
    projectsContainer.empty();

    for (var projectTitle in projects) {
        var project = projects[projectTitle];

        var projectItem = $('<a href="#">' + projectTitle + '</a>');
        projectItem.appendTo(projectsContainer);
        projectItem.unbind().click(function(title) {
            return function() {
                activeProject = projects[title];
                if (chartLoaded) {
                    drawChart();
                }
            }
        }(projectTitle));
    }

    if (chartLoaded) {
        drawChart();
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

                    if (!projects[project.title.toLowerCase()]) {
                        projects[project.title.toLowerCase()] = [];
                    }

                    var hours = {};
                    getHours(hours, project);

                    projects[project.title.toLowerCase()].push({
                        id: p,
                        uid: u,
                        hours: hours
                    });
                }
            }
        }
    }

    refreshStat();
}
database.ref("users").on("value", dbListener);

function getHours(hours, project) {
    if (project.tasks)
    for (t in project.tasks) {
        var task = project.tasks[t];

        if (task.times)
        for (var tm in task.times) {
            var time = task.times[tm];

            if (time.start_time < time.end_time) {
                var date = new Date(time.start_time).toLocaleDateString();

                if (!hours)
                    hours = [];
                if (!hours[date])
                    hours[date] = 0;

                hours[date] += (time.end_time - time.start_time) / 3600000.0;
            }
        }
    }
}