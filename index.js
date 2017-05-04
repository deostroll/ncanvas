var cp = require('child_process');
var fork = cp.fork;
var fs = require('fs');

var generator = fork('./generate.js');
var plotter = fork('./plot.js');

var count = 0;
var args = process.argv.slice(2);
var iterations = parseInt(args[0]);

generator.on('message', function(d){
  if (d.status === 'ready') {
    // for (var i = 0; i < iterations; i++, count++) {
    //   generator.send(i + 1);
    // }
    generator.send(iterations);
  }
  else if(d.status === 'ok') {
    plotter.send(d.data);
  }
});

plotter.on('message', function(d) {
  console.log(d);
  if (d.status === 'ok') {

    if (d.levels === iterations) {
      process.exit(0)
    }
  }
});
