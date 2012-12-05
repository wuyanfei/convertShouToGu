var redis1 = require('redis').createClient(6390, '172.16.39.31'); //源redis（读）
var redis2 = require('redis').createClient(6390, '172.16.33.203'); //测试redis（写）
// var redis2 = require('redis').createClient(6399, '218.204.252.208'); //广州redis（写）
var async = require('async');
var stocklistGP = [];
var stocklistZQ = [];

//加载码表
var loadStockInfo = function(callback) {
    redis2.hvals('SC.STOCK', function(err, replies) {
      if(null == replies || "" == replies) {
        console('');
      } else {
        replies.forEach(function(obj) {
          var stock = obj.split("|");
          if(stock[3] != 'HK') {
            if(stock[4].indexOf('H_ZQ') != -1 || stock[4].indexOf('Z_ZQ') != -1) {
              stocklistGP.push(stock[3] + stock[1]);
            } else {
              stocklistZQ.push(stock[3] + stock[1]);
            }
          }
        });
      }
      callback(null);
    });
  };

// var testStockCodeTable = function(){
//     redis2.hvals('SC.STOCK', function (err, replies) {
//         if (null == replies || "" == replies) {
//             console('');
//         } else {
//             replies.forEach(function (obj) {
//                 var stock = obj.split("|");
//                 if (stock[3] != 'HK') {
//                     if(stock[6] === 'Y'){
//                         console.info(stock[3] + stock[1]+'  '+stock[6]);
//                     }            
//                     stocklist.push(stock[3] + stock[1]);
//                 }
//             });
//         }
//         // callback(null);
//     });
// }
//取K线数据，然后再补充数据
var dealKline = function(ktype, cb) {
    console.log(ktype);
    async.forEach(stocklist, function(item, callback) {
      var codeKeys = 'KLINE.' + item;
      redis1.lrange(codeKeys + '.' + ktype, 0, -1, function(err, replies) {
        redis2.del(codeKeys + '.' + ktype, function(ee, rr) {
          async.forEach(replies, function(item, ccb) {
            redis2.rpush(codeKeys + '.' + ktype, item, function(err) {
              if(err != null) {
                console.info(err);
              }
              ccb();
            });
          }, function(error) {
            console.info(error);
            callback();
          });
        });
      });
    }, function(error) {
      console.log(ktype + '-->over');
      if(error != null) {
        console.info(error);
      }
      cb(null);
    });
  };


//补充分时数据
var dealMline = function(stockid) {
    var codeKeys = 'MLINE.' + stockid;
    redis1.lrange(codeKeys, 0, -1, function(err, replies) {
      redis2.del(codeKeys, function(ee, rr) {
        async.forEach(replies, function(item, ccb) {
          redis2.rpush(codeKeys, item, function(err) {
            console.info('write>' + item);
            if(err != null) {
              console.info(err);
            }
            ccb();
          });
        }, function(err) {
          process.exit(0);
        });
      });
    });

  };

var stockKline = function(codeKeys, callback) {
    redis1.lrange(codeKeys + '.' + ktype, 0, -1, function(err, replies) {
      redis2.del(codeKeys + '.' + ktype, function(ee, rr) {
        async.forEach(replies, function(item, ccb) {
          var oKline = item.split('|');
          oKline[5] = oKline[5] * onehand;
          oKline[7] = oKline[7] * onehand;
          var str = '';

          for(var i = 0; i < oKline.length; i++) {
            if(i < oKline.length - 1) {
              str += oKline[i] + '|';
            } else {
              str += oKline[i];
            }
          }
          // console.info(str);
          redis2.rpush(codeKeys + '.' + ktype, str, function(err) {
            console.info(codeKeys + '.' + ktype);
            str = '';
            oKline = [];
            if(err != null) {
              console.info('results-->' + err);
            }
            ccb();
          });
        }, function(error) {
          console.info(codeKeys + '.' + ktype + ' error-->' + error);
          callback();
        });
      });
    });
  }


  //取K线数据，将成交量单位由手修改为股
var dealKline2 = function(ktype, marketType, cb) {
    var onehand = 100;
    var stocklist = [];
    if(marketType === 0) {
      onehand = 100;
      stocklist = stocklistGP;
    } else if(marketType === 1) {
      marketType === 10;
      stocklist = stocklistZQ;
    }
    async.forEach(stocklist, function(item, callback) {
      var codeKeys = 'KLINE.' + item;
      stockKline(codeKeys, callback)
    }, function(error) {
      console.log(ktype + '-->over');
      if(error != null) {
        console.info(error);
      }
      cb(null);
    });
  };

var stockMline = function(codeKeys, callback) {
    redis1.lrange(codeKeys, 0, -1, function(err, replies) {
      if(replies != null) {
        redis2.del(codeKeys, function(ee, rr) {
          async.forEach(replies, function(item, ccb) {
            // console.info(codeKeys + '-->' + item);
            var oMline = item.split('|');
            oMline[2] = oMline[2] * 100 + '';
            var str = oMline.join('|');
            // console.info(codeKeys+'-->'+str);
            redis2.rpush(codeKeys, str, function(err, res) {
              // console.info(codeKeys + '  ' + str);
              if(err != null) {
                console.info('===>' + err);
              }
              ccb();
            });
          }, function(err) {
            if(err != null) {
              console.info(codeKeys + '----' + err);
            }
            callback();
          });
        });
      } else {
        callback();
      }
    });
  }

  //将分时数据成交量单位由手修改为股
var dealMline2 = function(callback) {
    async.forEach(stocklist, function(item, cb) {
      var codeKeys = 'MLINE.' + item;
      console.info('-->' + codeKeys);
      stockMline(codeKeys, cb);
    }, function(error) {
      console.log('MLINE-->over');
      if(error != null) {
        console.info(error);
      }
      callback();
    });
  };

var stockDyam = function(codeKeys, callback) {
    redis1.get(codeKeys, function(err, replies) {
      if(info != null) {
        var info = replies.split('|');
        info[12] = info[12] * 100;
        console.info(codeKeys + ' ' + info[12]);
        var str = info.join('|');
        // console.info(replies);
        if(replies != null) {
          redis2.set(codeKeys, str, function(err, res) {
            // console.info(codeKeys + '  ' + str);
            if(err != null) {
              console.info('===>' + err);
            }
            callback();
          });
        }
      }
    });
  }

  //将分时数据成交量单位由手修改为股
var dealDyam = function(cb) {
    async.forEach(stocklist, function(item, callback) {
      var codeKeys = 'SDC.' + item;
      console.info(codeKeys);
      stockDyam(codeKeys, callback);
    }, function(error) {
      console.log('动态行情-->over');
      if(error != null) {
        console.info(error);
      }
      cb();
    });
  };

//运行K线
var runKLine = function() {
    async.waterfall([

    function(callback) {
      loadStockInfo(callback);
    }, function(callback) {
      dealKline('DAY', callback); //日K
    }, function(callback) {
      dealKline('MTH', callback); //月K
    }, function(callback) {
      dealKline('FY', callback); //年K
    }, function(callback) {
      dealKline('HY', callback); //半年K
    }, function(callback) {
      dealKline('SY', callback); //季K
    }, function(callback) {
      dealKline('WK', callback); //周K
    }], function(error, results) {
      console.info('all task over.');
      process.exit(0);
    });
  };

//运行K线
var runKLine2 = function() {
    async.waterfall([

    function(callback) {
      loadStockInfo(callback);
    }, function(callback) {
      dealKline2('DAY', callback); //日K
    }, function(callback) {
      dealKline2('MTH', callback); //月K
    }, function(callback) {
      dealKline2('FY', callback); //年K
    }, function(callback) {
      dealKline2('HY', callback); //半年K
    }, function(callback) {
      dealKline2('SY', callback); //季K
    }, function(callback) {
      dealKline2('WK', callback); //周K
    }, function(callback) {
      dealKline2('05M', callback); //年K
    }, function(callback) {
      dealKline2('15M', callback); //半年K
    }, function(callback) {
      dealKline2('30M', callback); //季K
    }, function(callback) {
      dealKline2('60M', callback); //周K
    }], function(error, results) {
      console.info('all task over.');
      process.exit(0);
    });
  };

//运行分时
var runMLine = function() {
    async.waterfall([

    function(callback) {
      loadStockInfo(callback);
    }, function(callback) {
      dealMline(callback);
    }], function(error, results) {
      console.info('all task over.');
      process.exit(0);
    });
  };
//运行分时
var runMLine2 = function() {
    async.waterfall([

    function(callback) {
      loadStockInfo(callback);
    }, function(callback) {
      dealMline2(callback);
    }], function(error, results) {
      console.info('all task over.');
      process.exit(0);
    });
  };

var runDyam = function() {
    async.waterfall([

    function(callback) {
      loadStockInfo(callback);
    }, function(callback) {
      dealDyam(callback);
    }], function(error, results) {
      console.info('all task over.');
      process.exit(0);
    });
  };

//node --max-stack-size=1024000 增加堆栈内存指令
//run(); //补充K线 全部
// dealMline('SZ000156')//补充分时 个股
// runKLine2(); //全量修改K线成交量
runMLine2(); //全量修改分时成交量
// runDyam();