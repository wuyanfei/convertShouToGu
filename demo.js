var worker = require('./worker');
var array = [];
for(var i = 0;i<100000;i++){
	array.push(i);
}
array.forEachSync(function(item,index,cback){
	console.log('index='+index+','+item);
	cback();
},function(){
	console.log('it is over.');
});