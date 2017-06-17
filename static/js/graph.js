class LineChart {
    constructor(svgElement) {
        const svg = d3.select(svgElement);

        const margin = { top: 16, right: 16, bottom: 32, left: 48 };
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
        this.x.domain([
            d3.min(data, user => d3.min(user.data, d => d.date)),
            d3.max(data, user => d3.max(user.data, d => d.date)),
        ]);
        this.y.domain([
            d3.min(data, user => d3.min(user.data, d => d.value)),
            d3.max(data, user => d3.max(user.data, d => d.value)),
        ]);

        this.g.append('g')
            .attr('transform', 'translate(0,' + this.height + ')')
            .call(d3.axisBottom(this.x))
            .select('.domain')
            .remove();

        this.g.append('g')
            .call(d3.axisLeft(this.y));

        data.forEach(user => {
            this.g.append('path')
                .datum(user.data)
                .attr('fill', 'none')
                .attr('stroke', user.color)
                .attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round')
                .attr('stroke-width', 1.5)
                .attr('d', this.line);
        });
    }
}


class PieChart {
    constructor(svgElement) {
        const svg = d3.select(svgElement);

        const width = +$(svgElement).width();
        const height = +$(svgElement).height();
        const radius = Math.min(width, height) / 2;

        const g = svg.append('g')
            .attr('transform', 'translate(' + width/2 + ',' + height/2 + ')');

        this.svg = svg;
        this.g = g;
        this.radius = radius;

        this.pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        this.path = d3.arc()
            .outerRadius(this.radius - 16)
            .innerRadius(0);
    }

    redraw(data) {
        const arc = this.g.selectAll('.arc')
            .data(this.pie(data))
            .enter().append('g')
            .attr('class', 'arc');

        arc.append('path')
            .attr('d', this.path)
            .attr('fill', d => d.data.color);

    }
}


class BarChart {
    constructor(svgElement) {
    }

    redraw(data) {
    }
}
