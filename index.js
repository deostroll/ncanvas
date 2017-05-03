var cp = require('child_process');
var fork = cp.fork;
var fs = require('fs');

var generator = fork('./generate.js');
var plotter = fork('./plot.js');

generator.on('message', function(d){
  if (d.status === 'ready') {
    generator.send(10)
  }
  else if(d.status === 'ok') {
    // plotter.send(d.data);
    fs.writeFile('input.json', JSON.stringify(d.data), {encoding: 'utf8'}, function(e){
      if (e) {
        console.error(e);
      }
      else {
        process.exit(0);
      }
    })
  }
})
