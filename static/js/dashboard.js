const visualizationCenter = {
    init() {
        this.lineChart = new LineChart('#line-chart');
        this.pieChart = new PieChart('#pie-chart');
        this.barChart = new BarChart('#bar-chart');
    },

    redraw(data) {
        /* const lineChartData = [
            {
                userId: 5,
                data: [
                    { value: 50, date: new Date(2017, 6, 5), },
                    { value: 48, date: new Date(2017, 6, 6), },
                    { value: 38, date: new Date(2017, 6, 7), },
                    { value: 60, date: new Date(2017, 6, 8), },
                ],
                color: 'steelblue',
            },
            {
                userId: 3,
                data: [
                    { value: 40, date: new Date(2017, 6, 5), },
                    { value: 44, date: new Date(2017, 6, 6), },
                    { value: 55, date: new Date(2017, 6, 7), },
                    { value: 23, date: new Date(2017, 6, 8), },
                ],
                color: 'orange',
            },
        ];*/

        const userHours = [];
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
                    data: [{ date: date, value: hours }],
                    color: users.find(u => u.pk == d.user).color,
                });
            }
        });

        userHours.forEach(u => u.data.sort((d1, d2) => d1.date - d2.date));
        this.lineChart.redraw(userHours);


        const activeTaskHours = [];
        tasks.filter(task => task.active).forEach(task => {
            activeTaskHours.push({
                taskId: task.pk,
                color: task.color,
                value: data.entries.filter(d => d.task == task.pk).reduce((a, b) => a + b.hours, 0),
            });
        });
        this.pieChart.redraw(activeTaskHours);


        const userIds = users.map(u => u.pk);
        const taskHours = [];
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
                const newTask = { taskId: d.task };
                newTask[d.user] = hours;
                taskHours.push(newTask);
            }
        });

        this.barChart.redraw(taskHours, userIds,
            users.reduce((a, b) => { a[b.pk] = b.color; return a; }, {}));
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
        (45 + hash % 40) + '%,' +
        (85 + hash % 10) + '%)';
    return color;
}

function hashCode(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}
