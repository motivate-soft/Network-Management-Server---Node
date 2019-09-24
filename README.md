# Wanos Central Manager setup guide

The Wanos Central Manager (WCM) solution consists out of two components: (1) WCM Service, (2) WCM Agent. The WCM Service will be bundled in our WCM appliance, where the WCM Agent is an executable installed on each Wanos device in the network.

# Prerequisites

The following prerequisites need to be installed on the WCM appliance or development host.

## Install Node.js

```
#!bash
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y build-essential

```

## Install MongoDB

### Install the key

```
#!bash

sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4
```

### Use one of the following commands depending on the Ubuntu version used

**Ubuntu 14.04 (Trusty)**

```
#!bash

echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/4.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.0.list
```

**Ubuntu 16.04 (Xenial)**

```
#!bash

echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/4.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.0.list
```

**Ubuntu 18.04 (Bionic)**

```
#!bash

echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.0.list
```

### Install

```
#!bash

sudo apt-get update
sudo apt-get install -y mongodb-org
```

### Start MongoDB server

You can either manually start MongoDB each time:

```
#!bash

sudo service mongod start
```

Or configure to automatically load MongoDB on boot:

```
#!bash

sudo systemctl enable mongod.service
```

## Install pkg

```
#!bash

sudo npm install -g pkg
```


# Development setup

The WCM consists out of the following repositories:

1. [wcm-backend](https://bitbucket.org/wanos/wcm-backend) - This is the [node.js](https://nodejs.org) and [gRPC](https://grpc.io/) backend that exposes HTTP web API endpoints to the WCM GUI as well as host the gRPC server for RPC communications to the Wanos devices.

2. [wcm-frontend](https://bitbucket.org/wanos/wcm-frontend) - Contains the WCM GUI web frontend implemented with [Vue.js](https://vuejs.org/)

3. [wcm-whub-client](https://bitbucket.org/wanos/wcm-whub-client) - This is the WCM agent that runs on the actual Wanos devices. It implements [gRPC](https://grpc.io/) client services for communication to the WCM backend service.

4. [wcm-proto](https://bitbucket.org/wanos/wcm-proto) - This project defines the gRPC [service definitions](https://grpc.io/docs/guides/concepts.html#service-definition) used by the WCM gRPC server and device agent. Essentially defines the protocol and message structures used for the RPC communication.

## Setup directory structure and clone the repositories

We'll clone all the above repositories under container directory. For the purposes of this guide we'll assume you start in your home directory `~/`

```
#!bash

mkdir wcm && cd wcm
git clone https://<YOUR-BITBUCKET-LOGIN>@bitbucket.org/wanos/wcm-backend.git ./wcm-backend
git clone https://<YOUR-BITBUCKET-LOGIN>@bitbucket.org/wanos/wcm-frontend.git ./wcm-frontend
git clone https://<YOUR-BITBUCKET-LOGIN>@bitbucket.org/wanos/wcm-proto.git ./wcm-proto
git clone https://<YOUR-BITBUCKET-LOGIN>@bitbucket.org/wanos/wcm-whub-client.git ./wcm-whub-client
```

## Install npm dependencies


```
#!bash

cd ~/wcm/wcm-proto
npm install
cd ~/wcm/wcm-backend
npm install
cd ~/wcm/wcm-whub-client
npm install
cd ~/wcm/wcm-frontend
npm install
```

## Generate gRPC service definitions

```
#!bash

cd ~/wcm/wcm-proto/protos/
./generate.sh
```

## Generate WCM agent binaries

```
#!bash

cd ~/wcm/wcm-whub-client
./generate.sh
```

# Running in development

Make sure MongoDB server is already running.

Start the backend server:

```
cd ~/wcm/wcm-backend
./start.sh
```

Start the frontend server:

```
cd ~/wcm/wcm-frontend
npm run serve
```

Open browser to http://<IP-OF-SERVER>:8080/

# Deploying the WCM agent

## Update wanos.conf

Add the following settings to the Wanos device wanos.conf, changing the WCM IP address to point to the IP of the WCM server, and latitude/longitude to the GPS coordinates of the location where the Wanos device is located.

```
WCM=127.0.0.1
LOCATION_LATITUDE=-33.918861
LOCATION_LONGITUDE=18.423300
```

Copy all files under `~/wcm/wcm-whub-client/bin` to the Wanos device and start the agent:

```
./wcm-whub-client
```

# Deploy WCM server for production

## Prerequisites

Ensure that all the prerequisites above are in place like node.js and mongodb etc.

Generate the production frontend code. The following script will copy the production frontend code to the public/ folder.
```
cd ~/wcm/wcm-backend
./generate-frontend.sh
```

Install PM2 manager:
```
sudo npm install -g pm2
```

Add wcm to pm2:
```
pm2 start ~/wcm/wcm-backend/ecosystem.config.js
pm2 save
```

Ensure pm2 starts on system boot. Issue the following command and run the output to generate the correct startup scripts. **Copy and paste in the CLI the ouput of this command to set up your startup hook.**
```
pm2 startup
```
