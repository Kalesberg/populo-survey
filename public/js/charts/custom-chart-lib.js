var ChartRenderer = {
    /**
    * Renders the bubble Chart
    * There are two sets of data needed to render this [ They follow a tree struct]
    * chart1Data - As given, helps in rendering the main chart
    * chart2Data - Helps to render the bubble that stays at corner
    * Assuming that data in the required format will be passed, and then this function can be made argumented
    * @returns {undefined}
    */
    _renderBubbleHBarChart: function (chart1Data, chart2Data, chart1DivId, chart2DivId) {

        // Reset the chart that might have been created early
        $(chart1DivId).html("");
        $(chart2DivId).html("");
      
        var r = 960, r2 = 200;
        var format = d3.format(",d"),
            fill = d3.scale.category20c();

        var bubble = d3.layout.pack()
                        .sort(null)
                        .size([r, r])
                        .padding(1.5);

        /*var bubble2 = d3.layout.pack()
                        .sort(null)
                        .size([r2, r])
                        .padding(1.5);*/

        var vis = d3.select(chart1DivId).append("svg")
                    .attr("viewBox", "0 0 960 960")
                    .attr("perserveAspectRatio", "xMinYMid")
                    .attr("width", r)
                    .attr("height", r)
                    .attr("class", "bubble bubble1");

        /*var vis2 = d3.select(chart2DivId).append("svg")
                    .attr("viewBox", "0 0 100 960")
                    .attr("perserveAspectRatio", "xMinYMid")
                    .attr("width", r2)
                    .attr("height", r)
                    .attr("class", "bubble bubble2");*/

        var _chartRenderer = function (data, vis) {
            var node = vis.selectAll("g.node")
                        .data(bubble.nodes(classes(data))
                        .filter(function (d) {
                            return !d.children;
                        }))
                        .enter().append("g")
                        .attr("class", "node")
                        .attr("transform", function (d) {
                            if (d.type !== undefined && d.type === 0) {
                                return "translate(" + (0) + "," + (d.y - 70) + ")";
                            }
                            return "translate(" + d.x + "," + d.y + ")";
                        });

            node.append("circle")
                .attr("r", function (d) {
                    if (d.type !== undefined && d.type === 0) {
                        return 40;
                    } else {
                        return d.r;
                    }
                })
                .style("fill", function (d) {
                    return d.color;
                });

            node.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", ".3em")
                .style({
                    "fill": function (d) {
                        return d.text_color;
                    },
                    "font-family": "Open Sans', sans-serif",
                    "font-weight": "normal",
                    "font-size": function (d) {
                        return d.scaleFont + "px";
                    }
                })
                .each(function (d, i) {
                    try {
                        var labelName = d.className;
                        arrayL = labelName.split("<br>"),
                        arrlength = (arrayL.length > 5) ? 8 : arrayL.length;
                        d3.select(this).attr('y', "-" + (((arrlength * 1.2) / 2)) + "em")
                        for (var i = 0; i < arrayL.length; i++) {
                            var labelR = d3.select(this).append('tspan').attr("x", "0").attr("dy", "1.5em").attr("data-classname", labelName);
                            labelR.text(arrayL[i]);
                        }
                    } catch (e) {
                        console.log(e);
                    }
                });

        };

        _chartRenderer(chart1Data, vis);
        //_chartRenderer(chart2Data, vis2);

        // Returns a flattened hierarchy containing all leaf nodes under the root.
        function classes(root) {
            var classes = [];

            function recurse(name, node) {
                if (node.children) {
                    node.children.forEach(function (child) {
                        recurse(node.name, child);
                });
                } else {
                    var data = {
                        packageName: name,
                        type: node.type,
                        className: node.name,
                        value: node.size,
                        color: node.color,
                        text_color: node.text_color, 
                        scaleFont: node.scaleFont
                    };

                    if (node.x !== undefined) {
                        data.x = node.x;
                        data.y = node.y;
                        data.r = node.r;
                    }
                    classes.push(data);
                }

            }

            recurse(null, root);
            return {
                children: classes
            };
        }

        ChartRenderer._resizeBubbleChart();
    },
    _resizeBubbleChart: function () {
        var chart = $(".bubble1");
        var aspect = chart.width() / chart.height(),
        container = chart.parent(),
        targetWidth = container.width();
        chart.attr("width", targetWidth);
        chart.attr("height", Math.round(targetWidth / aspect));

        /*chart = $(".bubble2");
        aspect = chart.width() / chart.height(),
        container = chart.parent(),
        targetWidth = container.width();
        chart.attr("width", targetWidth);
        chart.attr("height", Math.round(targetWidth / aspect));*/
    },

    /*
     * Renders the Grouped Vertical chart for Skills
     * The sample data is taken to render this
     * Parameters can be set to make it render accordingly
     */
    _renderVBarChart: function (chartData, chartDivId, chartYAxisOption, colorRange, barWidth) {
        // Remove the previous element
        //
        $(chartDivId).html("");

        if(colorRange.length == 0)
            colorRange = ["#1C4594", "#12AEA9", "#C2C3C4", "#DFE045"];

        // The values for bar should be in range of 0-4
        var rangeValuesDomain = [0, 1, 2, 3, 4];
        var rangeMap = chartYAxisOption;
        var barCount = colorRange.length;

        var margin = {
            top: 20,
            right: 20,
            bottom: 120,
            left: 180
        },
        width = 750 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

        var chartRenderer = function (data) {
            var x0 = d3.scale.ordinal()
                        .rangeRoundBands([0, width], .1);

            var x1 = d3.scale.ordinal();

            var y = d3.scale.linear()
                        .range([height, 0]);

            var color = d3.scale.ordinal()
                        .range(colorRange);

            var xAxis = d3.svg.axis()
                        .scale(x0)
                        .orient("bottom");

            var yAxis = d3.svg.axis()
                        .scale(y)
                        .orient("left")
                        .tickFormat(function (d, i) {
                            return rangeMap[d];
                        })
                        .tickValues(rangeValuesDomain);

            var svg = d3.select(chartDivId).append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform", "translate(" + (margin.left-40) + "," + margin.top + ")");

            var ratingNames = d3.keys(data[0]).filter(function (key) {
                return key !== "State";
            });

            // Push the ratings and update the prev array
            data.forEach(function (d) {
                d.ratings = ratingNames.map(function (name) {
                    return {
                        name: name,
                        value: +d[name]
                    };
                });
            });

            x1.domain(ratingNames).rangeRoundBands([0, x0.rangeBand()]);
            y.domain([rangeValuesDomain[0], rangeValuesDomain[rangeValuesDomain.length-1]]);

            svg.append("g")
                .attr("class", "x axis ")
                .attr("transform", "translate(-5," + 0 + ")")
                .append("svg:path")
                .attr("d", "M 0 " + height + " L " + width + " " + height + " Z")
                .style("stroke-width", 1)
                .style("stroke", "#E0E0E0")
                .style("fill", "none");
    
            svg.append("g")
                .attr("class", "y axis ")
                .attr("transform", "translate(-5, 0)")
                .append("svg:path")
                .attr("d", "M 0 " + height + " L 0 -20 Z")
                .style("stroke-width", 1)
                .style("stroke", "#E0E0E0")
                .style("fill", "none");

            svg.append("g").attr("class", "y axis skills__yaxis")
                .attr("transform", "translate(-10,0)")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end");

            // Wrap the text for Yaxis
            svg.selectAll(".skills__yaxis .tick text")
                .call(ChartRenderer._wrapText, 17, false, true);
        
            // y-axis lines    
            svg.selectAll(".skills__yaxis .tick line")
                .call(ChartRenderer._yAxisLine, width);
    
            var currentX = 0;
            var state = svg.selectAll(".state")
                            .data(data)
                            .enter().append("g")
                            .attr("class", "state")
                            .attr("transform", function (d, i) {
                                if (i !== 0)
                                    currentX = currentX + (barWidth * (barCount+1));
                                return "translate(" + currentX + ",0)";
                            });

            currentX = 0;
            svg.selectAll(".x-axis")
                .data(data)
                .enter().append("g")
                .attr("class", "x-axis")
                .attr("transform", function (d, i) {
                    if (i !== 0)
                        currentX = currentX + (barWidth * (barCount + barCount));
                    return "translate(" + currentX + "," + (height + 20) + ")";
                })
                .append("text").text(function (d) {
                    return d.State;
                })
                .attr("dy", ".1em");

            // Wrap the x-axis labels
            svg.selectAll(".x-axis text")
                .call(ChartRenderer._wrapText, 14, true);

            var valX = 0
            state.selectAll("rect")
                .data(function (d) {
                    return d.ratings;
                })
                .enter().append("rect")
                .attr("width", barWidth)
                .attr("x", function (d, i) {
                    if (i !== 0) {
                        valX = valX + barWidth;
                    }
                    if ((1 + 1) % 4 == 0) {
                        valX = 0;
                    }
                    var calX = x1(d.name) - ((16) * i);
                    return valX;
                })
                .attr("y", function (d) {
                    return y(d.value);
                })
                .attr("height", function (d) {
                    return height - y(d.value);
                })
                .style("fill", function (d) {
                    return color(d.name);
                });
        };

        while (chartData.length) {
            chartRenderer((chartData.splice(0, 5)));
        }

    },

    _wrapText: function (text, width, bSkipDyCalc, bIsVertical) {
        text.each(function () {
            var text = d3.select(this),
                words = $('<div/>').html(text.text()).text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeightReducer = bIsVertical && words.join(" ").length > width ? 1 : 0,
                lineHeight = 1.30, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")) - lineHeightReducer,
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.text().length > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    if (bSkipDyCalc) {
                        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", lineHeight + "em").text(word);
                    } else {
                        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }

                }
            }
        });
    },

    _yAxisLine: function (line, width) {
        line.each(function () {
            var line = d3.select(this);
            line.attr("x2", width)
                .attr("y2", 1)
                .attr("transform", "translate(5,0)")
                .attr("style", "stroke-width: 1;stroke: rgb(224, 224, 224);fill: none;");
        });
    },
    
    _renderSlider: function (data_obj, dataDiv, chartTitle, expandView) {
        var $dataDiv = $(dataDiv);
        $dataDiv.empty();
    
        $dataDiv.append('<div class="panel-title"><span>' + chartTitle + '</span></div>');
    
        var slider_tpl_obj = _.template(slider_tpl);
        $dataDiv.append(slider_tpl_obj({items: data_obj, expandView: expandView}));
    }
};

slider_tpl = "<% _.each(items, function(item, key, list) { %> \
    <% \
        main_label = ''; \
        main_bar_ball = ''; \
        main_bar_label = ''; \
        toggled = ''; \
        if (item.score >= 0 && item.score <= 12.5) { \
            main_label = 'output-big-5--trait-label_NEGATIVE'; \
            main_bar_ball = 'percent-bar--ball_NEGATIVE-FILL'; \
            main_bar_label = 'c1'; \
        } \
        else if (item.score > 12.5 && item.score <= 37.5) { \
            main_label = 'output-big-5--trait-label_NEGATIVE2'; \
            main_bar_ball = 'percent-bar--ball_NEGATIVE2-FILL'; \
            main_bar_label = 'c2'; \
        } \
        else if (item.score > 37.5 && item.score <= 62.5) { \
            main_label = 'output-big-5--trait-label_NEUTRAL'; \
            main_bar_ball = 'percent-bar--ball_NEUTRAL-FILL'; \
            main_bar_label = 'c3'; \
        } \
        else if (item.score > 62.5 && item.score <= 87.5) { \
            main_label = 'output-big-5--trait-label_POSITIVE2'; \
            main_bar_ball = 'percent-bar--ball_POSITIVE2-FILL'; \
            main_bar_label = 'c4'; \
        } \
        else if (item.score > 87.5) { \
            main_label = 'output-big-5--trait-label_POSITIVE'; \
            main_bar_ball = 'percent-bar--ball_POSITIVE-FILL'; \
            main_bar_label = 'c5'; \
        } \
        if(expandView) { \
            toggled = 'toggled'; \
        } \
    %> \
    <div class='percent-bar-and-score <%= toggled %>'> \
        <div class='percent-bar-and-score--label output-big-5--trait-label <%= main_label %>'> \
            <%= item.name %> \
            <i class='icon icon-down-arrow percent-bar-and-score--toggle-icon'></i> \
            <%= item.tooltip != null && item.tooltip != '' ? \"<div class='tooltip'>\" + item.tooltip + \"</div>\" : '' %> \
        </div> \
        <div class='percent-bar percent-bar-and-score--percent-bar'> \
            <div class='percent-bar--meter' style='-webkit-transform: translate(<%= item.score %>%); transform: translate(<%= item.score %>%)'> \
            <div class='percent-bar--ball <%= main_bar_ball %>'></div> \
            <div class='percent-bar-and-score--number <%= main_bar_label %>'> \
                <%= item.scorelabel %></div> \
            </div> \
        </div> \
    </div> \
    <div class='output-big-5--sub-tree'> \
        <% _.each(item.children, function(item2, key, list) { %> \
            <% \
                sub_label = ''; \
                sub_bar_ball = ''; \
                sub_bar_label = ''; \
                if (item2.score >= 0 && item2.score <= 12.5) { \
                    sub_label = 'output-big-5--trait-label_NEGATIVE'; \
                    sub_bar_ball = 'percent-bar--ball_NEGATIVE-FILL'; \
                    sub_bar_label = 'c1'; \
                } \
                else if (item2.score > 12.5 && item2.score <= 37.5) { \
                    sub_label = 'output-big-5--trait-label_NEGATIVE2'; \
                    sub_bar_ball = 'percent-bar--ball_NEGATIVE2-FILL'; \
                    sub_bar_label = 'c2'; \
                } \
                else if (item2.score > 37.5 && item2.score <= 62.5) { \
                    sub_label = 'output-big-5--trait-label_NEUTRAL'; \
                    sub_bar_ball = 'percent-bar--ball_NEUTRAL-FILL'; \
                    sub_bar_label = 'c3'; \
                } \
                else if (item2.score > 62.5 && item2.score <= 87.5) { \
                    sub_label = 'output-big-5--trait-label_POSITIVE2'; \
                    sub_bar_ball = 'percent-bar--ball_POSITIVE2-FILL'; \
                    sub_bar_label = 'c4'; \
                } \
                else if (item2.score > 87.5) { \
                    sub_label = 'output-big-5--trait-label_POSITIVE'; \
                    sub_bar_ball = 'percent-bar--ball_POSITIVE-FILL'; \
                    sub_bar_label = 'c5'; \
                } \
            %> \
            <div class='percent-bar-and-score'> \
                <div class='percent-bar-and-score--label output-big-5--sub-trait-label <%= sub_label %>'> \
                    <%= item2.name %> \
                    <%= item2.tooltip != null && item2.tooltip != '' ? \"<div class='tooltip'>\" + item2.tooltip + \"</div>\" : '' %> \
                </div> \
                <div class='percent-bar percent-bar-and-score--percent-bar'> \
                    <div class='percent-bar--meter' style='-webkit-transform: translate(<%= item2.score %>%); transform: translate(<%= item2.score %>%)'> \
                    <div class='percent-bar--ball <%= sub_bar_ball %>'></div> \
                    <div class='percent-bar-and-score--number <%= sub_bar_label %>'> \
                        <%= item2.scorelabel %></div> \
                    </div> \
                </div> \
            </div> \
        <% }); %> \
    </div> \
<% });%>";

$(document).on('click', '.output-big-5--trait-label', function() {
    $(this).closest('.percent-bar-and-score').toggleClass('toggled');
});

//behaviors graph tooltip
$('body').on('mouseover', '.percent-bar--ball', function () {
    var cicrleMarkerPosition = $(this).position();
    var leftPosition;

    leftPosition = cicrleMarkerPosition.left - 160 - 3;
    $(this).closest('.percent-bar').parent().find('.tooltip').css({ "visibility": "visible", "opacity": "1", "left": leftPosition + 'px' });
})
$('body').on('mouseout', '.percent-bar--ball', function () {
    $(this).closest('.percent-bar').parent().find('.tooltip').css({ "visibility": "hidden", "opacity": "0" });
})