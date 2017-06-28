function getTimeLabel(hours) {
    if (hours > 1) {
        return Math.round(hours) + ' hrs';
    }
    return Math.round(hours*60) + ' mins';
}

class LineChart {
    constructor(svgElement, legendContainer) {
        const svg = d3.select(svgElement);

        const margin = { top: 48, right: 128, bottom: 32, left: 48 };
        const width = +$(svgElement).width() - margin.left - margin.right;
        const height = +$(svgElement).height() - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        this.legend = d3.select(legendContainer);

        this.width = width;
        this.height = height;
        this.svg = svg;
        this.g = g;

        this.x = d3.scaleTime().rangeRound([0, this.width]);
        this.y = d3.scaleLinear().rangeRound([this.height, 0]);

        this.line = d3.line()
            .x(d => this.x(d.date))
            .y(d => this.y(d.value));
    }

    redraw(data) {
        this.g.selectAll('*').remove();

        this.x.domain([
            d3.min(data, user => d3.min(user.data, d => d.date)),
            d3.max(data, user => d3.max(user.data, d => d.date)),
        ]);
        this.y.domain([
            0, //d3.min(data, user => d3.min(user.data, d => d.value)),
            d3.max(data, user => d3.max(user.data, d => d.value)),
        ]);

        this.g.append('g')
            .attr('transform', 'translate(0,' + this.height + ')')
            .call(d3.axisBottom(this.x));

        this.g.append('g')
            .call(d3.axisLeft(this.y))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '0.35em')
            .attr('fill', '#000')
            .text('Hours');

        const user = this.g.selectAll('.user')
            .data(data)
            .enter().append('g').attr('class', 'user');

        user.append('path')
            .attr('fill', 'none')
            .attr('stroke', user => user.color)
            .attr('stroke-linejoin', 'round')
            .attr('stroke-linecap', 'round')
            .attr('stroke-width', 2.5)
            .attr('d', user => this.line(user.data));

        user.selectAll('circle')
            .data(user => user.data.map(d => ({ name: user.userName, date: d.date, value: d.value, color: user.color })))
            .enter()
            .append('circle')
            .attr('fill', d => d.color)
            .attr('r', 5)
            .attr('cx', d => this.x(d.date))
            .attr('cy', d => this.y(d.value))
            .on('mouseenter', function(d) {
                d3.select(this)
                    .attr('r', 7);
            })
            .on('mouseout', function(d) {
                d3.select(this)
                    .attr('r', 5);
            })
            .append('title')
            .text(d => d.name + ' (' + getTimeLabel(d.value) + ')');

        user.append('text')
            .datum(user => ({ userName: user.userName, data: user.data[user.data.length - 1] }))
            .attr('transform', d => ('translate(' + this.x(d.data.date) + ',' + this.y(d.data.value) + ')' ))
            .attr('x', 6)
            .attr('dy', '0.35em')
            .text(d => d.userName);

        const legend = this.legend
            .selectAll('.legend-element')
            .data(data)
            .enter().append('div')
            .attr('class', 'legend-element');

        legend.append('span')
            .style('background-color', user => user.color);
        legend.append('label')
            .text(user => user.userName);
    }
}


class AreaChart {
    constructor(svgElement, legendContainer) {
        const svg = d3.select(svgElement);

        const margin = { top: 48, right: 16, bottom: 32, left: 48 };
        const width = +$(svgElement).width() - margin.left - margin.right;
        const height = +$(svgElement).height() - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        this.legend = d3.select(legendContainer);

        this.width = width;
        this.height = height;
        this.svg = svg;
        this.g = g;

        this.x = d3.scaleTime().rangeRound([0, width]);
        this.y = d3.scaleLinear().rangeRound([this.height, 0]);

        this.stack = d3.stack();
        this.area = d3.area()
            .x(d => this.x(d.data.date))
            .y0(d => this.y(d[0]))
            .y1(d => this.y(d[1]));
    }

    redraw(data, keys, objects) {
        this.g.selectAll('*').remove();
        this.x.domain(d3.extent(data, d => d.date));
        this.y.domain([0, d3.max(data, d => keys.reduce((a, b) => a + d[b], 0))]);

        this.g.append('g')
            .attr('transform', 'translate(0,' + this.height + ')')
            .call(d3.axisBottom(this.x));

        this.g.append('g')
            .call(d3.axisLeft(this.y))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 10)
            .attr('fill', '#000')
            .text('Hours');

        const layer = this.g.selectAll('.layer')
            .data(this.stack.keys(keys)(data))
            .enter().append('g')
            .attr('class', 'layer');

        layer.append('path')
            .attr('fill', d => objects.find(o => o.id == d.key).color)
            .attr('stroke', 'rgba(0, 0, 0, 0.1)')
            .attr('stroke-width', 2)
            .attr('d', this.area)
            .on('mouseenter', function(d) {
                d3.select(this)
                    .attr('stroke-width', 4)
                    .attr('stroke', 'rgba(0, 0, 0, 0.3)');
            })
            .on('mouseout', function(d) {
                d3.select(this)
                    .attr('stroke-width', 2)
                    .attr('stroke', 'rgba(0, 0, 0, 0.1)');
            })
            .append('title')
            .text(d => objects.find(o => o.id == d.key).name);

        const legend = this.legend
            .selectAll('.legend-element')
            .data(keys)
            .enter().append('div')
            .attr('class', 'legend-element');

        legend.append('span')
            .style('background-color', key => objects.find(o => o.id == key).color);
        legend.append('label')
            .text(key => objects.find(o => o.id == key).name);
    }
}


class PieChart {
    constructor(svgElement, legendContainer) {
        const svg = d3.select(svgElement);

        const width = +$(svgElement).width();
        const height = +$(svgElement).height();
        const radius = Math.min(width, height) / 2;

        const g = svg.append('g');

        this.svg = svg;
        this.g = g;
        this.radius = radius;
        this.width = width;
        this.height = height;

        this.pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        this.path = d3.arc()
            .outerRadius(this.radius - 32)
            .innerRadius(0);

        this.legend = d3.select(legendContainer);
    }

    redraw(data) {
        this.g.selectAll('*').remove();

        this.g.append('g')
            .attr('transform', 'translate(' + (this.width/2) + ',' + (this.height/2) + ')')
            .selectAll('.arc')
            .data(this.pie(data))
            .enter().append('g')
            .attr('class', 'arc')
            .append('path')
            .attr('d', this.path)
            .attr('fill', d => d.data.color)
            .attr('stroke-width', 3)
            .on('mouseenter', function(d) {
                d3.select(this)
                    .attr('stroke', 'rgba(0, 0, 0, 0.1)')
                    .attr('transform', 'scale(1.05)');
            })
            .on('mouseout', function(d) {
                d3.select(this)
                    .attr('stroke', null)
                    .attr('transform', null);
            })
            .append('title')
            .text(d => d.data.taskName + ' (' + getTimeLabel(d.data.value) + ')');

        const legend = this.legend
            .selectAll('.legend-element')
            .data(data)
            .enter().append('div')
            .attr('class', 'legend-element');

        legend.append('span')
            .style('background-color', task => task.color);
        legend.append('label')
            .text(task => task.taskName);
    }
}


class BarChart {
    constructor(svgElement, legendContainer) {
        const svg = d3.select(svgElement);

        const margin = { top: 48, right: 16, bottom: 32, left: 48 };
        const width = +$(svgElement).width() - margin.left - margin.right;
        const height = +$(svgElement).height() - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        this.legend = d3.select(legendContainer);

        this.width = width;
        this.height = height;
        this.svg = svg;
        this.g = g;

        this.x = d3.scaleBand().rangeRound([0, this.width]).padding(0.5).align(0.1);
        this.y = d3.scaleLinear().rangeRound([this.height, 0]);

        this.stack = d3.stack();
    }

    redraw(data, keys, objects) {
        this.g.selectAll('*').remove();

        this.x.domain(data.map(d => d.taskName));
        this.y.domain([0, d3.max(data, d => keys.reduce((a, b) => a + d[b], 0))]);

        this.g.append('g')
            .attr('transform', 'translate(0,' + this.height + ')')
            .call(d3.axisBottom(this.x));

        this.g.append('g')
            .call(d3.axisLeft(this.y))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 10)
            .attr('fill', '#000')
            .text('Hours');

        this.g.append('g')
            .selectAll('g')
            .data(this.stack.keys(keys)(data))
            .enter().append('g')
            .attr('fill', d => objects.find(o => o.id == d.key).color)
            .selectAll('rect')
            .data(d => d)
            .enter().append('rect')
            .attr('x', d => this.x(d.data.taskName))
            .attr('y', d => this.y(d[1]))
            .attr('height', d => this.y(d[0]) - this.y(d[1]))
            .attr('width', this.x.bandwidth())
            .attr('stroke-width', 3)
            .attr('transform-origin', '50% 50%')
            .on('mouseenter', function(d) {
                d3.select(this)
                    .attr('stroke', 'rgba(0, 0, 0, 0.1)')
                    .attr('transform', 'scale(1.05)');
            })
            .on('mouseout', function(d) {
                d3.select(this)
                    .attr('stroke', null)
                    .attr('transform', null);
            })
            .append('title')
            .text(d => d.data.taskName + ' (' + getTimeLabel(d[1] - d[0]) + ')');


        const legend = this.legend
            .selectAll('.legend-element')
            .data(keys)
            .enter().append('div')
            .attr('class', 'legend-element');

        legend.append('span')
            .style('background-color', key => objects.find(o => o.id == key).color);
        legend.append('label')
            .text(key => objects.find(o => o.id == key).name);
    }
}
