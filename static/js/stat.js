google.charts.load('current', {'packages':['line', 'timeline']});
google.charts.setOnLoadCallback(drawChart);

var activeProjectTitle = null;
var activeProject = null;
var chartLoaded = false;

function drawEmptyChart() {
    $('#line-chart-div').html("No data available for this project");
    $('#timeline-div').html("");
    $("#report-div").html("");
    $("#report-after-mark-div").html("");
}

function drawChart() {
    chartLoaded = true;

    if (activeProject) {
        var totalHours = {};
        var totalAfterHours = {};

        // First draw the line chart
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Day');

        for (var i in activeProject) {
            var info = activeProject[i];
            data.addColumn('number', users[info.uid].username);

            totalHours[users[info.uid].username] = 0;
            totalAfterHours[users[info.uid].username] = 0;
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

        dates.sort(function(d1, d2){
            return new Date(d1) - new Date(d2);
        });

        if (dates.length <= 0) {
            drawEmptyChart();
            return;
        }

        for (var d in dates) {
            var date = dates[d];
            var temp = [date];
            for (var i in activeProject) {
                if (activeProject[i].hours[date]) {
                    temp.push(activeProject[i].hours[date]);
                    totalHours[users[activeProject[i].uid].username] +=
                        activeProject[i].hours[date];
                }
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
                            user.username,
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

        var report = "";
        for (var username in totalHours) {
            report += "<b>" + username + " :</b> " +
                getInterval(totalHours[username]*3600000) + "<br>";
        }
        $("#report-div").html(report);

        if ($('#get-mark-date').val() != '' && $('#get-mark-date').val() != null) {
            var afterDates = [];
            var mark = new Date($('#get-mark-date').val());
            console.log(mark);
            var newdate = new Date(mark);
            newdate.setDate(newdate.getDate() - 1);
            console.log(newdate);
            mark = newdate;
            for(var i = 0; i<dates.length; i++){
                var date = dates[i];
                if (new Date(date).getTime() >= mark.getTime()){
                    afterDates.push(date);
                }
            }
            for (var d in afterDates) {
                var date = afterDates[d];
                var temp = [date];
                for (var i in activeProject) {
                    if (activeProject[i].hours[date]) {
                        temp.push(activeProject[i].hours[date]);
                        totalAfterHours[users[activeProject[i].uid].username] +=
                            activeProject[i].hours[date];
                    }
                    else
                        temp.push(0);
                }
                data.addRow(temp);
            }
            var report = "";
            for (var username in totalHours) {
                report += "<b>" + username + " :</b> " +
                    getInterval(totalAfterHours[username]*3600000) + "<br>";
            }
            $("#report-after-mark-div").html(report);
        }
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
        projectItem.unbind().click(function(item, title) {
            return function() {
                $('#export-container').show();

                $('#project-list .active').removeClass('active');
                item.addClass('active');
                activeProject = projects[title];
                activeProjectTitle = title;

                if (chartLoaded) {
                    drawChart();
                }
            }
        }(projectItem, projectTitle));
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
$(document).ready(function() {
    $('#get-mark-date').change(function() {
        refreshStat();
    });
});

function getHours(hours, project) {
    if (project.tasks){
        for (t in project.tasks) {
            var task = project.tasks[t];

            if (task.times){
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
    }
}

function exportHours() {
    if (activeProject) {
        var allTasks = {};
        var allUsers = {};
        var totalHours = 0;

        // Collect data, for each user in the active project
        for (var i in activeProject) {
            var info = activeProject[i];
            var user = users[info.uid];
            var project = user.projects[info.id];

            // For each task of the user in the project
            if (project.tasks)
            for (var t in project.tasks) {
                var task = project.tasks[t];

                // Get total hours for each task and each user

                if (!(task.title.toLowerCase() in allTasks))
                    allTasks[task.title.toLowerCase()] = { totalHours: 0, userHours: {} };

                if (!(user.username in allTasks[task.title.toLowerCase()].userHours)) {
                    allTasks[task.title.toLowerCase()].userHours[user.username] = 0;
                }

                if (task.times)
                for (var tm in task.times) {
                    var time = task.times[tm];

                    if (time.start_time < time.end_time) {
                        var hours = (time.end_time - time.start_time) / 3600000.0;

                        allTasks[task.title.toLowerCase()].userHours[user.username] += hours;
                        allTasks[task.title.toLowerCase()].totalHours += hours;

                        if (!(user.username in allUsers))
                            allUsers[user.username] = 0;

                        allUsers[user.username] += hours;
                        totalHours += hours;
                    }
                }
            }
        }

        var tableContainer = $('<div></div>');
        var table = $('<table></table>');
        tableContainer.append(table);

        var heading = $('<tr></tr>');
        table.append(heading);

        heading.append('<th>Tasks</th>');
        for (var user in allUsers) {
            heading.append('<th>' + user + '</th>');
        }
        heading.append('<th>Total</th>');

        for (var task in allTasks) {
            var row = $('<tr></tr>');
            table.append(row);

            row.append('<td>' + task[0].toUpperCase() + task.slice(1) + '</td>');
            for (var user in allUsers) {
                if (user in allTasks[task].userHours)
                    row.append('<td>' + Math.round(allTasks[task].userHours[user]) + '</td>')
                else
                    row.append('<td>0</td>')
            }
            row.append('<td>' + Math.round(allTasks[task].totalHours) + '</td>')
        }

        table.append($('<tr></tr>'));
        var totalRow = $('<tr></tr>');
        table.append(totalRow);

        totalRow.append($('<td>Total</td>'));
        for (var user in allUsers) {
            totalRow.append('<td>' + Math.round(allUsers[user]) + '</td>');
        }
        totalRow.append('<td>' + Math.round(totalHours) + '</td>');

        // var newWindow = window.open('', '_blank');
        // newWindow.document.write(tableContainer.html());
        // newWindow.document.title = activeProjectTitle.toUpperCase() + ' HOUR BREAKDOWN';
        // window.open('data:application/vnd.ms-excel,' + encodeURIComponent(tableContainer.html()));
        var d = new Date()
		var df = d.getMonth()+'-'+d.getDate()+'-'+d.getYear()+' '+(d.getHours()+1)+'_'+d.getMinutes();
        table.table2excel({
            exclude: ".excludeThisClass",
            name: activeProjectTitle.toUpperCase(),
            filename: activeProjectTitle.toUpperCase() + ' HOUR BREAKDOWN ' + df,
            fileext: ".xls",
        });
    }
}
