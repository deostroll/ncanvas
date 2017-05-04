function ulam(iterations) {
  var tree = new Tree(iterations);
  tree.arrange();
  return tree;
}

const NodeType = {
  ROOT : 'root',
  EVEN : 'even',
  ODD : 'odd'
};

function Node(parent, value) {
  this.parent = parent;
  this.value = value;
  this.y = parent ? parent.y + 1: 0;
  this.x = 0;
  this.type = null;

  Object.defineProperty(this, 'childs', {
    enumerable: false,
    value: []
  });
}

Node.prototype = {
  addChild: function(n) {
    // var n = new Node(this, value);
    this.childs.push(n);
  },
  toString: function() {
    return JSON.stringify({
      x: this.x,
      y: this.y,
      z: this.value,
      p: this.parent ? this.parent.value : '-root-'
    })
  }
}

function Tree(levels) {
  var root = new Node(null, 1);
  root.type = NodeType.ROOT;
  var nodes = [root];

  var isFrac = (x) => (x - Math.floor(x)) > 0;
  var children = nodes.slice();
  var newNode = function(parent, value, type) {
    var n = new Node(parent, value);
    n.type = type;
    parent.addChild(n);
    nodes.push(n);
    return n;
  };
  var runOnce = false;
  for (var i = 1; i < levels; i++) {
    var childNodes = [];
    while (children.length) {
      var n = children.shift();
      if (n.value === 1 && !runOnce) {
        runOnce = true;
      }
      else if(n.value === 1) {
        continue;
      }
      childNodes.push(newNode(n, n.value * 2,NodeType.EVEN));

      var value = (n.value - 1)/3;
      if (!isFrac(value) && value > 0) {
        childNodes.push(newNode(n, value, NodeType.ODD));
      }
    }
    children = childNodes
  }

  this.nodes = nodes;
  this.levels = levels;
}

Tree.prototype.arrange = function() {
  var nodes = this.nodes;
  var graph = [nodes[0]];

  var expandRight = function(p, length) {
    var offset;
    if (length === 1) {
      offset = 0;
    }
    else if(length % 2 === 0) {
      offset = length;
    }
    else {
      offset = length - 1;
    }

    if (offset > 0) {
      graph.filter(function(b){
        return b.x > p.x && b.y <= p.y;
      }).forEach(function(b){
        b.x += offset;
      });
    }

    var parentOffset = Math.floor(offset/2);

    if (p.y > 0) {
      graph.filter(function(b) {
        return b.x === p.x && b.y < p.y;
      })
      .forEach(function(b){
        b.x += parentOffset;
      });
    }

    p.x += parentOffset;

  }; //end expand

  for(var i = 1, j = this.levels; i < j; i++) {
    var levelNodes = nodes.filter( x=> x.y === i );
    graph = graph.concat(levelNodes);
    var levelParents = levelNodes.map(x => x.parent)
      .filter((x, idx, a) => a.indexOf(x) === idx );

    levelParents.forEach(p => {
      // console.log(p);
      var parentX = p.x;
      var size = p.childs.length;
      var half = Math.ceil(size/2);

      for(var j = 0, offset = 0; j < size; j ++) {
        if (j === half && size % 2 === 0) {
          offset = 1;
        }
        p.childs[j].x = parentX + j + offset;
      }

      expandRight(p, size);

    });
  }
}

module.exports = ulam;

if (require.main === module && !process.send) {
  var levels = 5;
  var tree = new Tree(levels);
  tree.arrange();
  // console.log(JSON.stringify(tree.nodes, null, 2));
  console.log(tree.nodes.join('\r\n'))
  process.send('hello world');
}
else {
  if (require.main === module) {
    process.on('message', function(msg){
      var tree = new Tree(msg);
      tree.arrange();
      console.log('Generated...');
      process.send({status: 'ok', data: tree});
    });
    process.send({ status: 'ready'})
  }
}
