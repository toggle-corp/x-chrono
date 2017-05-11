let stats = {
    init: function($scope) {
        $scope.stats = this;
        this.scope = $scope;
        this.scope.statsShown = false;

        // Default date range filter is 1 week
        this.scope.statStartDate = new Date(new Date().getTime() - 60*60*24*7*1000);
        this.scope.statEndDate = new Date();
    },

    show: function(project) {
        this.scope.statsShown = true;

        this.data = this.getData(project);
        this.refreshChart(this.data);
    },

    refreshChart: function(data) {
        data = angular.copy(data);
        let svgContainer = d3.select('#stats').select('svg');
        let svg = svgContainer.select('g');

        // Filters
        let startDate = this.scope.statStartDate;
        let endDate = this.scope.statEndDate;
        if (startDate) {
            data.forEach(d => {
                d.values = d.values.filter(v => v.date >= startDate);
            });
        }
        if (endDate) {
            data.forEach(d => {
                d.values = d.values.filter(v => v.date <= endDate);
            });
        }

        let width = svgContainer.attr('width')-128;
        let height = svgContainer.attr('height')-32;
        let xScale = d3.scaleTime().range([0, width]);
        let yScale = d3.scaleLinear().range([height, 0]);

        // The line generator
        let line = d3.line()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.hours));

        // Set domain for x and y position generators
        xScale.domain([
            d3.min(data, d => d3.min(d.values, v => v.date)),
            d3.max(data, d => d3.max(d.values, v => v.date)),
        ]);
        yScale.domain([
            0,
            d3.max(data, d => d3.max(d.values, v => v.hours)),
        ]);

        // Update current data
        let selection = svg.selectAll('.task').data(data);
        selection.select('path').attr('d', d => line(d.values));
        selection.select('text').datum(d => ({ name: d.name, value: d.values[d.values.length-1] }))
            .attr('transform', d => 'translate(' + xScale(d.value.date) + ', ' + yScale(d.value.hours) + ')')
            .text(d => d.name);

        // Add new data
        let task = selection.enter().append('g').attr('class', 'task');
        task.append('path')
            .attr('class', 'line')
            .attr('stroke', d => 'hsl(' + Math.random() * 360 + ', 60%, 40%)')
            .attr('d', d => line(d.values));

        // task.append('text')
        //     .datum(d => ({ name: d.name, value: d.values[d.values.length-1] }))
        //     .attr('transform', d => 'translate(' + xScale(d.value.date) + ', ' + yScale(d.value.hours) + ')')
        //     .text(d => d.name);

        // Remove unnecessary data
        selection.exit().remove();

        // The axes
        let xAxis = svg.select('.x.axis');
        if (xAxis.empty()) {
            xAxis = svg.append('g').attr('class', 'x axis')
                .attr("transform", "translate(0," + height + ")");
        }
        xAxis.call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%B %d')));

        let yAxis = svg.select('.y.axis');
        if (yAxis.empty()) {
            yAxis = svg.append('g').attr('class', 'y axis');
        }
        yAxis.call(d3.axisLeft(yScale));
    },

    getData: function(projectId) {
        let project = this.scope.db.projects.find(p => p.projectId == projectId);
        let data = [];
        for (let i=0; i<project.tasks.length; i++) {
            let task = project.tasks[i];

            if (task.entries.length > 0) {
                let dateHours = {};
                for (let j=0; j<task.entries.length; j++) {
                    let entry = task.entries[j];
                    if (entry.endTime) {
                        let date = new Date(entry.startTime).toDateString();
                        let hours = (entry.endTime - entry.startTime)/36e5;

                        if (!dateHours[date]) {
                            dateHours[date] = 0;
                        }
                        dateHours[date] += hours;
                    }
                }

                let taskData = [];
                for (let date in dateHours) {
                    taskData.push({
                        date: new Date(date),
                        hours: dateHours[date],
                    });
                }

                taskData.sort((t1, t2) => (t1.date - t2.date));
                data.push({
                    name: task.name,
                    values: taskData,
                });
            }
        }
        return data;
    },

    export: function(projectId) {
        window.location.href = exportUrl.replace('0', ''+projectId);
    },
};
