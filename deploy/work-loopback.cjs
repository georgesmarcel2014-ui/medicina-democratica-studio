// The Work executor can deny interface enumeration while permitting loopback.
// Remotion's private renderer binds 127.0.0.1 and only needs that interface.
const os = require('node:os');
const {syncBuiltinESMExports} = require('node:module');
const networkInterfaces = os.networkInterfaces;

os.networkInterfaces = function () {
  try {
    return networkInterfaces();
  } catch (error) {
    if (error.syscall !== 'uv_interface_addresses' || error.info?.errno !== 1) throw error;
    return {lo: [{
      address: '127.0.0.1', netmask: '255.0.0.0', family: 'IPv4',
      mac: '00:00:00:00:00:00', internal: true, cidr: '127.0.0.1/8',
    }]};
  }
};
syncBuiltinESMExports();
