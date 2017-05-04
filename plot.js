var Konva = require('konva');
var fs = require('fs');

const PIx2 = Math.PI * 2;

function Graph(graph) {
  var g = graph.nodes;
  var self = this;
  this.vertexes = g.map(x => new Vertex(x));
  this.edges = [];
  this.levels = graph.levels;

  var _findIndexByValue = function(value) {
    var vertexes = self.vertexes;
    for(var i = 0, j = vertexes.length; i < j; i++) {
      if (vertexes[i].value === value) {
        return i;
      }
    }
    return -1;
  };
  g.forEach( (v, i) => {
    if (v.parent) {
      var pidx = _findIndexByValue(v.parent.value);
      var parent = self.vertexes[pidx];
      var child = self.vertexes[i];
      parent.addChild(child);
      self.edges.push({
        from: pidx,
        to: i
      });
    }
  });
};

Graph.prototype.render = function() {
  var vertexes = this.vertexes;
  var edges = this.edges;
  var spacing = {
    h: 100,
    v: 100,
    offset: 15,
    maxX: -1,
    maxY: -1
  };

  var layer = new Konva.Layer();
  var background = new Konva.Rect({
    fill: 'white'
  });

  layer.add(background);

  var points = [];
  vertexes.forEach( v => {
    var x = v.get('x');
    var y = v.get('y');
    var value = v.get('value');

    var px = x * spacing.h + spacing.offset;
    var py = y * spacing.v + spacing.offset;
    points.push({x: px, y: py });
    if (spacing.maxX < px) {
      spacing.maxX = px;
    }

    if (spacing.maxY < py) {
      spacing.maxY = py;
    }
    var color = {};
    var type = v.get('type');
    // console.log(type, value);
    if (type === 'root') {
      color.fill = 'green';
      color.text = 'white';
    }
    else if (type === 'even') {
      color.fill = 'yellow';
      color.text = 'black';
    }
    else if (type === 'odd') {
      color.fill = 'lightgreen';
      color.text = 'black';
    }
    else {
      color.fill = 'lightpink';
      color.text = 'black';
    }

    var circle = new Konva.Circle({
      radius: 15,
      x: px,
      y: py,
      fill: color.fill
    });

    var text = new Konva.Text({
      x: circle.x(),
      y: circle.y(),
      text: value.toString(),
      fill: color.text
    });

    var bounds = text.getClientRect();
    text.offset({
      x: bounds.width/2,
      y: bounds.height/2
    });
    layer.add(circle);
    layer.add(text);
  });

  edges.forEach(e => {
    var pointFrom = points[e.from], pointTo = points[e.to];
    var theta = Math.atan2(pointTo.y - pointFrom.y, pointTo.x - pointFrom.x);
    var r = 15;
    var cos = r * Math.cos(theta), sin = r * Math.sin(theta);
    var arrow = new Konva.Arrow({
      x: pointFrom.x,
      y: pointFrom.y,
      points: [
        pointTo.x - pointFrom.x - cos, pointTo.y - pointFrom.y - sin,
        cos, sin,
      ],
      fill: 'black',
      pointerWidth: 5,
      pointerLength: 5,
      stroke: 'black'
    });
    layer.add(arrow);
  });

  var label = new Konva.Text({
    text: 'Iterations: ' + this.levels,
    fontSize: 42,
    fill: 'black'
  });

  background.height(spacing.maxY + spacing.offset*2);
  background.width(spacing.maxX + spacing.offset*2);

  layer.add(label);

  var canvas = layer.toCanvas({
    height: spacing.maxY + spacing.offset*2,
    width: spacing.maxX + spacing.offset*2
  });
  var pad = function(n, pad) {
    pad = pad || 2;
    var str = '';
    for(var k = 0; k < pad; k++) str += '0';
    str += n;
    return str.substring(str.length - 1 - pad);
  } ;

  var fname = 'output-' + pad(this.levels) + '.png';
  var ws = fs.createWriteStream(fname);
  return canvas.pngStream().pipe(ws);
};

function Vertex(x) {
  var config = x;
  var self = this;
  this.parent = null;
  this.childs = [];
  this.value = x.value;
  this.x = 0;
  this.y =
  this.addChild = function(c) {
    self.childs.push(c);
    c.parent = self;
  };

  this.get = function(prop) {
    return x[prop];
  };

}

module.exports = Graph;

if (!process.send && require.main === module) {
  var args = process.argv.slice(2);
  var file = args[0];
  fs.readFile(file, {encoding: 'utf8'}, function(e, data){
    if (e) {
      console.error(e);
    }
    else {
      var json = JSON.parse(data);
      var graph = new Graph(json);
      graph.render();
    }
  });
}
else {
  process.on('message', function(d) {
    // console.log(d.nodes[2]);
    var graph = new Graph(d);
    graph.render().on('close', () => {
      console.log('plotted...');
      process.send({status: 'ok', levels: d.levels })
    });
  })
}
