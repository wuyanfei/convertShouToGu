 Usage: index.js [options] <redis地址><数据类型><股票代码>

  Options:

    -h, --help      输出帮助信息
    -V, --version   输出版本号
    -c, --code <n>  股票代码
    -t, --type <n>  数据类型,kline,mline,trade,sdc
    -r --redis <n>  redis地址
    -a --all <n>    根据数据类型转换所有数据
    -d --demo <n>   测试用接口

  Examples:

    1:数据类型默认取k线
      $ node index.js -r 172.16.33.203:6390 -t kline -c SH600000
      $ node index.js -r 172.16.33.203:6390 -t mline -c SH600000
      $ node index.js -r 172.16.33.203:6390 -t trade -c SH600000
      $ node index.js -r 172.16.33.203:6390 -t sdc   -c SH600000
    2:根据数据类型转换所有数据
      $ node index.js -r 172.16.33.203:6390 -t kline -a all
      $ node index.js -r 172.16.33.203:6390 -t mline -a all
      $ node index.js -r 172.16.33.203:6390 -t trade -a all
      $ node index.js -r 172.16.33.203:6390 -t sdc   -a all

