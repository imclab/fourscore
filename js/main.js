(function(){
	'use-strict'
/********************************/

	function range(start, stop, step) {
	  if (arguments.length < 3) {
	    step = 1;
	    if (arguments.length < 2) {
	      stop = start;
	      start = 0;
	    }
	  }
	  if ((stop - start) / step === Infinity) throw new Error("infinite range");
	  var range = [],
	       k = range_integerScale(Math.abs(step)),
	       i = -1,
	       j;
	  start *= k, stop *= k, step *= k;
	  if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k);
	  else while ((j = start + step * ++i) < stop) range.push(j / k);
	  return range;
	};

	function range_integerScale(x) {
	  var k = 1;
	  while (x * k % 1) k *= 10;
	  return k;
	}	
/********************************/

	function generateRandomData(numb_submissions, size){
		var data = {},
				obj;
		data.submissions = [];
		for (var i = 0; i < numb_submissions; i++){
			obj = {};
			obj.uid = 'id-' + i
			obj.comment = 'Submission text ' + i;
			obj.x_sentiment = Math.ceil((Math.random() * size)/2) * ((i % 2 == 0) ? -1 : 1);
			obj.y_sentiment = Math.ceil((Math.random() * size)/2) * ((i % 3 != 0) ? -1 : 1);
			data.submissions.push(obj);
		}
		return data;
	}

	function makeGridArray(data, size) {
		var extent;
		// If they haven't specified a custom input range then make it a one-to-one based on grid size
		if (!data.input_extents){
			extent = Math.floor(size/2);
			data.input_extents = [extent * -1, extent];
		}
		var userValueToGridIdx = new Scale(data.input_extents[0], data.input_extents[1], 0, size - 1),
		    grid = range(0,size).map(function(c) { return range(0,size).map(function(b) { return {submission_value: [Math.round(userValueToGridIdx.inverse(b)),Math.round(userValueToGridIdx.inverse(c))], count: 0, ids: []} }) }),
				grid_x,
				grid_y,
				grid_xy,
				max = 0,
				cell;

		for (var i = 0; i < data.submissions.length; i++){
			grid_x = Math.round(userValueToGridIdx(data.submissions[i].x_sentiment));
			grid_y = Math.round(userValueToGridIdx(data.submissions[i].y_sentiment));
			grid_xy = [grid_x, grid_y];
			cell = grid[grid_xy[1]][grid_xy[0]];
			cell.count++;
			cell.ids.push(data.submissions[i].uid); 
			if (cell.count > max) max = cell.count;
		}
		return {grid: grid, extents: [0, max]}
	}

	function setSquareFill(extents, val){
		val = Number(val);
		var colorScale = new Scale(extents[0], extents[1], 0, 4) // Use a five color scale for now.
		return 'q' + Math.round(colorScale(val)) + '-5';

	}

	function convertGridSelector(grid_selector){
		if (typeof grid_selector == 'string') return $(grid_selector);
		return grid_selector;
	}

	function gridArrayToMarkup(grid_selector, color_brewer_style_name, Grid){
		$grid = convertGridSelector(grid_selector);
		$grid.hide()
				 .addClass(color_brewer_style_name)
				 .addClass('st-grid')
				 .html('');

		var grid = Grid.grid,
				extents = Grid.extents,
				grid_width  = $grid.width(),
			  grid_height = $grid.height(),
			  square_value,
			  submission_value,
			  ids;

		// For every row in the grid, make a row element
		for (var i = 0; i < grid.length; i++ ){
			$('<div class="st-row"></div>').height(grid_height / grid.length)
																	.appendTo($grid);

			// Now make a cell with the aggregate data
			for (var j = 0; j < grid.length; j++){
				square_value = grid[i][j].count;
				submission_value = JSON.stringify(grid[i][j].submission_value);
				ids   = JSON.stringify(grid[i][j].ids)
				$('<div class="st-cell"></div>').width(grid_width / grid.length - 1) // Subtract one for the margin given between cells
																			 .attr('data-submission-value', submission_value)
																			 .attr('data-ids', ids)
																			 .attr('data-cell-id', grid[i][j].submission_value[0] + '-' + grid[i][j].submission_value[1])
																			 .html(square_value)
																			 .addClass(setSquareFill(extents, square_value))
																			 .appendTo($($grid.find('.st-row')[i]));
			}
		}
		$grid.show();

	}

	function submissionsToMarkup(subm_data, conf){
		var Grid = makeGridArray(subm_data, conf.grid_size);
		gridArrayToMarkup(conf.grid_selector, conf.color_brewer_style_name, Grid);

	}

	function bindHandlers(){
		$('.st-grid').on('mouseover', '.st-cell', function(){
			var $this = $(this);
			console.log('Input submission: ', $this.attr('data-submission-value'))
		});

		$('.st-grid').on('mouseleave', function(){
			/* HIDE TOOLTIP */
		});

		$('.st-grid').on('click', '.st-cell', function(){
			var $this = $(this);
			var selected_id = $this.attr('data-cell-id');
			var submission_values = JSON.parse($this.attr('data-submission-value'));
			var nv = {
				x_sentiment: submission_values[0],
				y_sentiment: submission_values[1]
			}

			console.log(nv);
			/* PROMPT FROM SUBMISSION */
			formSubmit(nv, selected_id)
		});
	}

	function formSubmit(new_data, selected_id){
		submission_data.submissions.push(new_data);
		updateGrid(submission_data);
		// Highlight that cell we clicked on, now that everything is redrawn
		$('.st-cell[data-cell-id="'+selected_id+'"]').addClass('st-selected');
	}

	function updateGrid(new_data){
		submissionsToMarkup(new_data, CONFIG);
	}

	function createViz(submission_data, CONFIG){
		submissionsToMarkup(submission_data, CONFIG);
		bindHandlers();
	}

	/* CONFIG THINGS */
	var CONFIG = {
		"grid_selector": '#grid',
		"grid_size": 10,
		"color_brewer_style_name": 'YlGnBu'
	}
	/* end config things */

	/* LOAD DATA */
	var submission_data = generateRandomData(1000, CONFIG.grid_size);

	/* Init */
	createViz(submission_data, CONFIG)

}).call(this);