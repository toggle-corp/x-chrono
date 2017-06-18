class LineChart {
    constructor(svgElement) {
        const svg = d3.select(svgElement);

        const margin = { top: 48, right: 128, bottom: 32, left: 48 };
        const width = +$(svgElement).width() - margin.left - margin.right;
        const height = +$(svgElement).height() - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

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
            .attr('stroke-width', 1.5)
            .attr('d', user => this.line(user.data));

        user.append('text')
            .datum(user => ({ userName: user.userName, data: user.data[user.data.length - 1] }))
            .attr('transform', d => ('translate(' + this.x(d.data.date) + ',' + this.y(d.data.value) + ')' ))
            .attr('x', 3)
            .attr('dy', '0.35em')
            .text(d => d.userName);
    }
}


class AreaChart {
    constructor(svgElement) {
        const svg = d3.select(svgElement);

        const margin = { top: 48, right: 16, bottom: 32, left: 48 };
        const width = +$(svgElement).width() - margin.left - margin.right;
        const height = +$(svgElement).height() - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

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
            .style('fill', d => objects.find(o => o.id == d.key).color)
            .attr('d', this.area);

        const legend = this.g.append('g')
            .attr('font-size', 10)
            .attr('text-anchor', 'end')
            .selectAll('g')
            .data(keys)
            .enter().append('g')
            .attr('transform', (d, i) => 'translate(0,' + i*20 + ')');

        legend.append('rect')
            .attr('x', this.width - 19)
            .attr('width', 19)
            .attr('height', 19)
            .attr('fill', key => objects.find(o => o.id == key).color);

        legend.append('text')
            .attr('x', this.width - 24)
            .attr('y', 9.5)
            .attr('dy', '0.32em')
            .text(key => objects.find(o => o.id == key).name);
    }
}


class PieChart {
    constructor(svgElement) {
        const svg = d3.select(svgElement);

        const width = +$(svgElement).width();
        const height = +$(svgElement).height();
        const radius = Math.min(width, height) / 2;

        const g = svg.append('g')
            .attr('transform', 'translate(' + width/2 + ',' + (height/2+16) + ')');

        this.svg = svg;
        this.g = g;
        this.radius = radius;

        this.pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        this.path = d3.arc()
            .outerRadius(this.radius - 32)
            .innerRadius(0);

        this.label = d3.arc()
            .outerRadius(50)
            .innerRadius(50);
    }

    redraw(data) {
        this.g.selectAll('*').remove();

        this.g.selectAll('.arc')
            .data(this.pie(data))
            .enter().append('g')
            .attr('class', 'arc')
            .append('path')
            .attr('d', this.path)
            .attr('fill', d => d.data.color);

        const getAngle = (d) => (180 / Math.PI * (d.startAngle + d.endAngle)/2 - 90);
        this.g.selectAll('.arc-text')
            .data(this.pie(data))
            .enter().append('g')
            .attr('class', 'arc-text')
            .append('text')
            .attr('transform', d => 'translate(' + this.label.centroid(d) + ') rotate(' + getAngle(d) + ')')
            .attr('dy', '0.35em')
            .text(d => d.data.taskName);
    }
}


class BarChart {
    constructor(svgElement) {
        const svg = d3.select(svgElement);

        const margin = { top: 48, right: 16, bottom: 32, left: 48 };
        const width = +$(svgElement).width() - margin.left - margin.right;
        const height = +$(svgElement).height() - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        this.width = width;
        this.height = height;
        this.svg = svg;
        this.g = g;

        this.x = d3.scaleBand().rangeRound([0, this.width]).paddingInner(0.1).align(0.1);
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
            .attr('width', this.x.bandwidth());

        const legend = this.g.append('g')
            .attr('font-size', 10)
            .attr('text-anchor', 'end')
            .selectAll('g')
            .data(keys)
            .enter().append('g')
            .attr('transform', (d, i) => 'translate(0,' + i*20 + ')');

        legend.append('rect')
            .attr('x', this.width - 19)
            .attr('width', 19)
            .attr('height', 19)
            .attr('fill', key => objects.find(o => o.id == key).color);

        legend.append('text')
            .attr('x', this.width - 24)
            .attr('y', 9.5)
            .attr('dy', '0.32em')
            .text(key => objects.find(o => o.id == key).name);

    }
}
