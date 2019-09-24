const YAML = require('yaml');
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const netplanFilePath = '/etc/netplan/50-cloud-init.yaml';

const _parseIpAddr = (ipStr) => {
	let ipNumArray = ipStr.split('.').map(num => {
		return parseInt(num);
	});

	return (ipNumArray[0] << 0) | 
		(ipNumArray[1] << 8) | 
		(ipNumArray[2] << 16) | 
		(ipNumArray[3] << 24);
};

const networkModule = {
	async getConfiguration() {
		const netCfgFile = fs.readFileSync(netplanFilePath, 'utf8');
		let cfg = YAML.parse(netCfgFile).network.ethernets;
		let cmdOut;
		let defaultInterface;

		// get default interface
		try {
			cmdOut = await exec(`route | grep '^default' | grep -o '[^ ]*$'`);
			if (cmdOut.stdout.length > 0) {
				defaultInterface = cmdOut.stdout.replace(/\n/, '');
			}
		} catch(e) {
			logger.warn(e);
		}

		// check if default interface is included in config file
		if (defaultInterface && !cfg[defaultInterface]) {
			cfg[defaultInterface] = {dhcp4: true};
		}

		let interfaces = await Promise.all(Object.keys(cfg).map(async name => {
			let dhcpCfg = cfg[name].dhcp4;
			let dhcp = (typeof(dhcpCfg) === 'boolean') ? dhcpCfg : !!dhcpCfg.match(/yes/i)
			let ipnmaskSet = cfg[name].addresses;
			let ip4 = '';
			let netmask = '';
			let gateway = (cfg[name].gateway4 || '');
			let nameServers = ((cfg[name].nameservers && cfg[name].nameservers.addresses) || []);

			// when DHCP is enabled, get resolved ip from system information
			if (dhcp || !ipnmaskSet || ipnmaskSet.length === 0) {
				try {
					cmdOut = await exec('ip -4 address show ' + name);
					let matches;
					if ((matches = cmdOut.stdout.match(/inet ([\d]+.[\d]+.[\d]+.[\d]+\/[\d]+)/i))) {
						ipnmaskSet = [matches[1]];
					}
				} catch(e) {
					logger.warn(e);
				}
			}

			// when DHCP is enabled, get resolved gateway from system information
			if (dhcp || gateway.length === 0) {
				try {
					cmdOut = await exec('ip -4 route');
					let matches;
					if ((matches = cmdOut.stdout.match(new RegExp('via ([\\d]+.[\\d]+.[\\d]+.[\\d]+) dev ' + name, 'i')))) {
						gateway = matches[1];
					}
				} catch(e) {
					logger.warn(e);
				}
			}

			// when DHCP is enabled, get resolved DNS server from system information
			if (dhcp || nameServers.length === 0) {
				try {
					cmdOut = await exec('systemd-resolve -4 -i ' + name + ' --status');
					let matches;
					if ((matches = cmdOut.stdout.match(/DNS Servers:[\s\t]+([\d\s\.\,]+)+/i))) {
						nameServers = matches[1].split(/[\s\,]+/);
					}
				} catch(e) {
					logger.warn(e);
				}
			}

			nameServers = nameServers.filter(addr => {
				return !!addr.match(/^\d+.\d+.\d+.\d+$/);
			});

			// parse config
			if (typeof ipnmaskSet === 'object' && typeof ipnmaskSet.map === 'function') {
				let ip4pair = ipnmaskSet.map(ipnmask => {
					if (!ipnmask.match('/')) return;

					let [ip, mask] = ipnmask.split('/');

					if (!ip.match(/^\d+.\d+.\d+.\d+$/)) return;

					if (typeof mask === 'string' && mask.match(/^\d+$/)) {
						let maskInt = (1 << parseInt(mask)) - 1;
						mask = ((maskInt >> 0) & 0xFF).toString() + '.' +
							((maskInt >> 8) & 0xFF).toString() + '.' +
							((maskInt >> 16) & 0xFF).toString() + '.' +
							((maskInt >> 24) & 0xFF).toString();
					}
					return [ip, mask];
				}).filter(obj => {
					return !!obj
				})[0];

				if (ip4pair && ip4pair.length == 2) {
					[ip4, netmask] = ip4pair;
				}
			}

			return {
				name: name,
				dhcp: dhcp,
				ip: ip4,
				netmask: netmask,
				gateway: gateway,
				ns1: nameServers[0],
				ns2: nameServers[1],
			};
		}));

		return interfaces;
	},

	async setConfiguration(config) {
		if (!Array.isArray(config) || !config.length)
			throw new Error('configuration should be array and not empty');

		let yamlObject = {};
		let invalidConfig = config.find(interface => {
			let {name, dhcp, ip, netmask, gateway, ns1, ns2} = interface;
			let ipFmt = /^\d+\.\d+\.\d+\.\d+$/;

			if (!dhcp && (!ip.match(ipFmt) || !netmask.match(ipFmt) || !gateway.match(ipFmt)
				|| (ns1 && !ns1.match(ipFmt)) || (ns2 && !ns2.match(ipFmt))))
				return true;

			cfg = { dhcp4: dhcp, dhcp6: false, addresses: [] };

			if (!dhcp) {
				let ipInt = _parseIpAddr(ip);
				let nmskInt = _parseIpAddr(netmask);
				let gwInt = _parseIpAddr(gateway);
				let nameServers = [];
				let i = 0;

				for (i = 0; i < 32; i++) {
					if (!(nmskInt & (1 << i))) {
						if ((i === 0) || ((nmskInt + 1) !== (1 << i)))
							return true;
						break;
					}
				}

				if ((ipInt & nmskInt) !== (gwInt & nmskInt))
					return true;

				if (ns1) nameServers.push(ns1);
				if (ns2) nameServers.push(ns2);

				cfg.gateway4 = gateway;
				cfg.addresses = [ip + '/' + i];
				if (nameServers.length > 0)
					cfg.nameservers = {addresses: nameServers};
			}

			yamlObject[name] = cfg;

			return false;
		});

		if (invalidConfig) {
			throw new Error('invalid config object');
		}

		let fileContent = YAML.stringify({
			network: {
				version: 2,
				ethernets: yamlObject
			}
		});

		const tmpFilePath = path.join(prjPath, '.netcfg.yaml');

		await fs.writeFileSync(tmpFilePath, fileContent);
		try {
			await exec(WCM_SCRIPT_PATH + ' -net "' + tmpFilePath + '"');
		} catch(e) {
			await fs.unlink(tmpFilePath);
	    throw e;
		}
		await fs.unlink(tmpFilePath);
	}
}

module.exports = networkModule;