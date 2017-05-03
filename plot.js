var Konva = require('konva');
var fs = require('fs');

const PIx2 = Math.PI * 2;

function Graph(graph) {
  var g = graph.nodes;
  var self = this;
  this.vertexes = g.map(x => new Vertex(x));
  this.edges = [];
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

  vertexes.forEach( v => {
    var x = v.get('x');
    var y = v.get('y');
    var value = v.get('value');

    var px = x * spacing.h + spacing.offset;
    var py = y * spacing.v + spacing.offset;
    if (spacing.maxX < px) {
      spacing.maxX = px;
    }

    if (spacing.maxY < py) {
      spacing.maxY = py;
    }

    var circle = new Konva.Circle({
      radius: 15,
      x: px,
      y: py,
      fill: 'lightgreen'
    });

    var text = new Konva.Text({
      x: circle.x(),
      y: circle.y(),
      text: value.toString(),
      fill: 'black'
    });

    var bounds = text.getClientRect();
    text.offset({
      x: bounds.width/2,
      y: bounds.height/2
    });
    layer.add(circle);
    layer.add(text);
  });

  var stage = new Konva.Stage({
    height: spacing.maxY + spacing.offset*2,
    width: spacing.maxX + spacing.offset*2
  });

  stage.add(layer);

  // var contents = stage.toDataURL();
  // fs.writeFileSync('out.txt', '<img src="' + contents + '" />', {encoding: 'utf8'});
  console.log(layer.getCanvas());
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


if (!process.send) {
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
