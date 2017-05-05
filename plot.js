var Canvas = require('canvas');
var util = require('util');
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
  var maxX = -1, maxY = -1;
  var points = vertexes.map((v, i) => {
    var x = 50 * (v.get('x') + 1), y = 50 * (v.get('y') + 1);
    maxX = maxX < x ? x: maxX;
    maxY = maxY < y ? y: maxY;
    return { x: x, y: y, v: v.get('value'), type: v.get('type')};
  });

  var radius = 15;
  var width = maxX + 50, height = maxY + 50;
  console.log(util.format('%dx%d', maxX, maxY));
  var canvas = new Canvas(width, height);
  var ctx = canvas.getContext('2d');
  var Pix2 = Math.PI * 2;
  ctx.font = '10px Arial';
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Pix2, false);
    ctx.closePath();
    ctx.fillStyle = p.type === 'root' ? 'green' : (p.type === 'even' ? 'lightblue' : 'lightgreen');
    ctx.fill();
    var measure = ctx.measureText(p.v);
    // console.log(measure);
    ctx.fillStyle = 'black';
    ctx.fillText(p.v, p.x - measure.width/2, p.y)
  });

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 3;

  edges.forEach( e => {
    var p1 = points[e.from], p2 = points[e.to];
    // console.log({
    //   p1: p1, p2: p2
    // });
    var Dx = p2.x - p1.x, Dy = p2.y - p1.y;

    var theta = Math.atan2(Dy, Dx);
    var dx = radius * Math.cos(theta), dy = radius*Math.sin(theta);

    ctx.beginPath();
    ctx.moveTo(p1.x + dx, p1.y + dy);
    ctx.lineTo(p2.x - dx, p2.y - dy);
    // ctx.closePath();
    ctx.stroke();
  });

  var pad = function(n, len) {
    len = len || 2;
    var str = '';
    var j = 0;
    while (j++ < len) str += '0';
    str += n;
    return str.substring(str.length - 1 - len);
  };

  var fname = util.format('output-%s.png', pad(this.levels));

  return canvas.pngStream().pipe(fs.createWriteStream(fname))
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
