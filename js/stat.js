google.charts.load('current', {'packages':['line']});
google.charts.setOnLoadCallback(drawChart);

var activeProject = null;
var chartLoaded = false;

function drawChart() {
    chartLoaded = true;

    if (activeProject) {
        var data = new google.visualization.DataTable();
        data.addColumn('number', 'Day');

        for (var i in activeProject) {
            var info = activeProject[i];
            console.log(users[info.uid]);
            data.addColumn('number', users[info.uid].username);
        }

        for (var j=0; j<15; ++j) {
            var temp = [j+1];
            for (var i in activeProject)
                temp.push(Math.random()*50);
            data.addRow(temp);
        }

        var options = {
            chart: {
              title: 'Box Office Earnings in First Two Weeks of Opening',
              subtitle: 'in millions of dollars (USD)'
            },
            width: 900,
            height: 500
        };

        var chart = new google.charts.Line(document.getElementById('chart-div'));
        chart.draw(data, options);
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

                    projects[project.title.toLowerCase()].push({
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
