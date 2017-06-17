const syncManager = {
    init: function() {
        $('#start-date-filter').change(() => this.fetch());
        $('#start-date-filter').change(() => this.fetch());
        $('#users-filter').change(() => this.fetch());
        $('#tasks-filter').change(() => this.fetch());
        this.fetch();
    },

    fetch: function() {
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
                return json;
            });

    },
};

$(document).ready(function() {
    syncManager.init();
    $('select').selectize();

    const lineChart = new LineChart('#line-chart');
    const data = [
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
    ];
    lineChart.redraw(data);


    const pieChart = new PieChart('#pie-chart');
    pieChart.redraw([
        { taskId: 1, value: 200, color: 'burlywood', },
        { taskId: 2, value: 100, color: 'orange', },
        { taskId: 3, value: 56, color: 'cornflowerblue', },
        { taskId: 4, value: 176, color: 'hotpink', },
    ]);


    const barChart = new BarChart('#bar-chart');
    barChart.redraw([
        {
            taskId: 1,
            data: [
                { userId: 1, value: 40, },
                { userId: 2, value: 38, },
                { userId: 3, value: 23, },
                { userId: 4, value: 48, },
            ],
        },
        {
            taskId: 2,
            data: [
                { userId: 1, value: 46, },
                { userId: 2, value: 32, },
                { userId: 3, value: 10, },
                { userId: 4, value: 30, },
            ],
        },
        {
            taskId: 3,
            data: [
                { userId: 1, value: 22, },
                { userId: 2, value: 20, },
                { userId: 3, value: 19, },
                { userId: 4, value: 30, },
            ],
        },
        {
            taskId: 4,
            data: [
                { userId: 1, value: 23, },
                { userId: 2, value: 34, },
                { userId: 3, value: 30, },
                { userId: 4, value: 50, },
            ],
        },
    ]);
});
