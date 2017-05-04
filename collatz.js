var Graph = require('./plot');
var collatz = require('./generate');

var iter = parseInt(process.argv[2]);

var tree = collatz(iter);

var graph = new Graph(tree);

graph.render().on('close', () => {
  console.log('Done');
});
