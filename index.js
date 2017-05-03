var cp = require('child_process');
var fork = cp.fork;

p = fork('./generate.js');

p.on('message', function(d){
  console.log(d);
  if (d.status === 'ready') {
    p.send(7)
  }
  else if(d.status === 'ready') {
    console.log(d.data);
  }
})
