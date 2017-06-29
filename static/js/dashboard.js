const visualizationCenter = {
    init() {
        $('#line-chart').closest('.svg-container').hide();
        this.areaChart = new AreaChart('#area-chart', '#area-chart-legend');

        $('#line-chart').closest('.svg-container').show();
        $('#area-chart').closest('.svg-container').hide();
        this.lineChart = new LineChart('#line-chart', '#line-chart-legend');

        this.pieChart = new PieChart('#pie-chart', '#pie-chart-legend');
        this.barChart = new BarChart('#bar-chart', '#bar-chart-legend');

        $('#export-table').click(() => this.export());

        $('#switch-line-area').click(function() {
            const activeChart = $(this).data('active-chart');
            if (activeChart == 'line') {
                $('#line-chart').closest('.svg-container').hide();
                $('#area-chart').closest('.svg-container').show();
                $(this).removeClass('fa-area-chart').addClass('fa-line-chart');
                $(this).data('active-chart', 'area');
            }
            else {
                $('#area-chart').closest('.svg-container').hide();
                $('#line-chart').closest('.svg-container').show();
                $(this).removeClass('fa-line-chart').addClass('fa-area-chart');
                $(this).data('active-chart', 'line');
            }
        });
    },

    redraw(data) {
        const userHours = [];
        const dates = [];

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

            if (!dates.find(d => d.toDateString() === date.toDateString())) {
                dates.push(date);
            }
        });

        userHours.forEach(u => {
            dates.forEach(date => {
                if (!u.data.find(d => d.date.toDateString() === date.toDateString())) {
                    u.data.push({ date: date, value: 0 });
                }
            });
            u.data.sort((d1, d2) => d1.date - d2.date);

            for (let i=u.data.length-1; i>=0; i--) {
                if (u.data[i].value === 0) {
                    u.data.splice(i, 1);
                } else break;
            }
        });
        this.lineChart.redraw(userHours);

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
        tasks.forEach(task => {
            const hours = data.entries.filter(d => d.task == task.pk).reduce((a, b) => a + b.hours, 0);

            if (hours > 0) {
                activeTaskHours.push({
                    taskId: task.pk,
                    taskName: task.name,
                    color: task.color,
                    value: hours
                });
            }
        });
        this.pieChart.redraw(activeTaskHours);


        let taskHours = [];
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
        header.find('tr').append('<th>Tasks</th>');
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
                row.append('<td class="hours">' + Math.round(task[userId]*100)/100 + '</td>');
                total += Math.round(task[userId]*100)/100;
            });

            row.append('<td class="hours">' + Math.round(total*100)/100 + '</td>');
        });

        const row = $('<tr></tr>');
        body.append(row);
        row.append('<td>Total</td>');

        let total = 0;
        userIds.forEach(userId => {
            let subTotal = Math.round(taskHours.reduce((a, b) => a + b[userId], 0) * 100)/100;
            total += subTotal;
            row.append('<td class="hours">' + subTotal + '</td>');
        });
        row.append('<td class="hours">' + Math.round(total*100)/100 + '</td>');
    },

    export() {
        const dataType = 'data:application/vnd.ms-excel';
        const tableWrapper = $('.table .content')[0];
        const tableHtml = tableWrapper.outerHTML.replace(/ /g, '%20');

        const a = $('<a></a>');
        a[0].href = dataType + ', ' + tableHtml;
        a[0].download = projectName + ' ' + teamName + ' - ' + new Date().toDateString()  + '.xls';
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
        // const tasks = $('#tasks-filter').val();
        const phases = $('#phases-filter').val();

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
        // if (tasks) {
        //     params.push('tasks=' + tasks.join(','));
        // }
        if (phases) {
            params.push('phases=' + phases.join(','));
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
    let h = (hash>>>0)/0xffffffff;
    let s = '60%';
    let l = '60%';
    h = Math.pow(h, -10);
    const color = 'hsl(' + Math.ceil(h*360) + ',' + s + ',' + l + ')';
    return color;
}

function hashCode(str) {
    let hash = 0, i, chr;
    str = padRight(str, '1234567abcdef', 128);

    for (let i = 0; i < str.length; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}

function padRight(s, c, n) {
    if (! s || ! c || s.length >= n) {
        return s;
    }

    var max = (n - s.length)/c.length;
    for (var i = 0; i < max; i++) {
        s += c;
    }
    s = s.substring(0, s.length - s.length%n);
    return s;
}
