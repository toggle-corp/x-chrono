const visualizationCenter = {
    init() {
        // this.lineChart = new LineChart('#line-chart');
        this.areaChart = new AreaChart('#area-chart');
        this.pieChart = new PieChart('#pie-chart');
        this.barChart = new BarChart('#bar-chart');

        $('#export-table').click(() => this.export());
    },

    redraw(data) {
        /*const userHours = [];
        data.entries.forEach(d => {
            const date = new Date(d.start_time);
            const hours = d.hours;

            const user = userHours.find(u => u.userId == d.user);
            if (user) {
                const dateHours = user.data.find(dt => dt.date.toDateString() == date.toDateString());
                if (dateHours) {
                    dateHours.value += hours;
                } else {
                    user.data.push({ date: date, value: hours });
                }
            } else {
                userHours.push({
                    userId: d.user,
                    userName: users.find(u => u.pk == d.user).displayName,
                    data: [{ date: date, value: hours }],
                    color: users.find(u => u.pk == d.user).color,
                });
            }
        });

        userHours.forEach(u => u.data.sort((d1, d2) => d1.date - d2.date));
        this.lineChart.redraw(userHours);*/

        const dayHours = [];
        let userIds = [];
        data.entries.forEach(d => {
            const date = new Date(new Date(d.start_time).toDateString());
            const hours = d.hours;

            const day = dayHours.find(dt => dt.date.toString() === date.toString());
            if (day) {
                if (day[d.user]) {
                    day[d.user] += hours;
                }
                else {
                    day[d.user] = hours;
                }
            } else {
                const newDay = { date: date };
                newDay[d.user] = hours;
                dayHours.push(newDay);
            }

            if (userIds.indexOf(d.user) < 0) {
                userIds.push(d.user);
            }
        });

        dayHours.forEach(day => {
            userIds.forEach(userId => {
                if (!day[userId]) {
                    day[userId] = 0;
                }
            });
        });

        dayHours.sort((d1, d2) => d1.date - d2.date);

        this.areaChart.redraw(dayHours, userIds,
            users.map(u => ({ name: u.displayName, id: u.pk, color: u.color })));


        const activeTaskHours = [];
        tasks.filter(task => task.active).forEach(task => {
            activeTaskHours.push({
                taskId: task.pk,
                taskName: task.name,
                color: task.color,
                value: data.entries.filter(d => d.task == task.pk).reduce((a, b) => a + b.hours, 0),
            });
        });
        this.pieChart.redraw(activeTaskHours);


        const taskHours = [];
        userIds = [];
        data.entries.forEach(d => {
            const hours = d.hours;
            const task = taskHours.find(t => t.taskId == d.task);
            if (task) {
                if (task[d.user]) {
                    task[d.user] += hours;
                } else {
                    task[d.user] = hours;
                }
            } else {
                const newTask = {
                    taskId: d.task,
                    taskName: tasks.find(t => t.pk == d.task).name,
                };
                newTask[d.user] = hours;
                taskHours.push(newTask);
            }

            if (userIds.indexOf(d.user) < 0) {
                userIds.push(d.user);
            }
        });

        taskHours.forEach(task => {
            users.forEach(user => {
                if (!task[user.pk]) {
                    task[user.pk] = 0;
                }
            });
        });

        this.barChart.redraw(taskHours, userIds,
            users.map(user => ({ id: user.pk, name: user.displayName, color: user.color })));


        // The table
        const table = $('<table></table>');
        $('.table .content').empty().append(table);

        const header = $('<thead></thead>');
        table.append(header);

        header.append('<tr></tr>');
        header.find('tr').append('<th></th>');
        userIds.forEach(userId => {
            header.find('tr').append('<th>' + users.find(u => u.pk == userId).displayName);
        });
        header.find('tr').append('<th>Total</th>');

        const body = $('<tbody></tbody>');
        table.append(body);

        taskHours.forEach(task => {
            const row = $('<tr></tr>');
            body.append(row);

            row.append('<td>' + task.taskName + '</td>');

            let total = 0;
            userIds.forEach(userId => {
                row.append('<td class="hours">' + parseInt(task[userId]) + '</td>');
                total += parseInt(task[userId]);
            });

            row.append('<td class="hours">' + total + '</td>');
        });

        const row = $('<tr></tr>');
        body.append(row);
        row.append('<td>Total</td>');

        let total = 0;
        userIds.forEach(userId => {
            let subTotal = taskHours.reduce((a, b) => a + parseInt(b[userId]), 0);
            total += subTotal;
            row.append('<td class="hours">' + subTotal + '</td>');
        });
        row.append('<td class="hours">' + total + '</td>');
    },

    export() {
        const dataType = 'data:application/vnd.ms-excel';
        const tableWrapper = $('.table .content')[0];
        const tableHtml = tableWrapper.outerHTML.replace(/ /g, '%20');

        const a = $('<a></a>');
        a[0].href = dataType + ', ' + tableHtml;
        a[0].download = projectName + ' ' + teamName + ' - ' + new Date().toDateString()  + '.xlsx';
        a[0].click();
    }
};

const syncManager = {
    init() {
        $('#apply-filters').click(() => this.fetch());
        this.fetch();
    },

    fetch() {
        const startDate = $('#start-date-filter').val();
        const endDate = $('#end-date-filter').val();
        const users = $('#users-filter').val();
        const tasks = $('#tasks-filter').val();

        const params = [];

        if (startDate) {
            params.push('start_date=' + startDate);
        }
        if (endDate) {
            params.push('end_date=' + endDate);
        }
        if (users) {
            params.push('users=' + users.join(','));
        }
        if (tasks) {
            params.push('tasks=' + tasks.join(','));
        }

        return fetch(summaryAPI + '?' + params.join('&'))
            .then(response => response.json())
            .then(json => {
                visualizationCenter.redraw(json);
                return json;
            });

    },
};

$(document).ready(function() {
    visualizationCenter.init();
    syncManager.init();

    $('select').selectize();
});


function getColor(str) {
    const hash = hashCode(str);
    const color = 'hsl(' + (hash % 360) + ',' +
        '40%, 75%)';
        //(45 + hash % 40) + '%,' +
        //(85 + hash % 10) + '%)';
    return color;
}

function hashCode(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}
