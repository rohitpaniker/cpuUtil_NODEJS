
var cpuStat = require('cpu-stat')
var si = require('systeminformation');
var _ = require('lodash');
var cpuRamObject = {}
var http = require('http');
var io = require('socket.io')();
var nodemailer = require('nodemailer');
var port = process.env.PORT || 3001;

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'njspucu3dm4b2j4q@ethereal.email',
        pass: 'yCzMCSdfgw9EeGRc5h'
    }
});

io.on('connection', (client) => {
  // here you can start emitting events to the client
  client.on('subscribeToStats', (interval) => {
    console.log('client is subscribing to timer with interval ', interval);
    setInterval(() => {
      cpuStat.usagePercent(function(err, percent, seconds) {
        var cpuUsage = {}
        var totalCores = cpuStat.totalCores();

        if(err) {
          return console.log('some error: ', err)
          cpuUsage['cpu_err'] = err
        }

        //cpu usage in percentage of all cores
        cpuUsage['cpuUtilization'] = Math.ceil(percent)

        //the approximate number of seconds the sample was taken over
        cpuUsage['cpu_time'] = Math.floor(seconds)

        //get the total number of cores
        cpuUsage['cpu_cores'] = totalCores

        si.mem(function(memUsage) {
          memUsage['ramUtilization'] = Math.ceil((memUsage.used/memUsage.total)*100)
          _.assign(cpuRamObject, cpuUsage, memUsage)
          if(parseInt(memUsage.ramUtilization) > 50) {
            let mailOptions = {
                    from: '"njspucu3dm4b2j4q" <njspucu3dm4b2j4q@ethereal.email>', // sender address
                    to: '', // list of receivers seperated by comma
                    subject: 'CPU AND MEMORY USAGE STATS - CRITICAL', // Subject line
                    text: 'Memory usage reached critical stage surpassing 50% RAM consumption. Please find the details:\r\n'+memUsage,
                    html: '<b>Thank You</b>'
                };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
                // Preview only available when sending through an Ethereal account
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            });
          }
          client.emit('stats', cpuRamObject);
          console.log('Total-Information:', cpuRamObject);
        });
      })
    }, interval);
  });
});

io.listen(port);
console.log('listening on port ', port);
