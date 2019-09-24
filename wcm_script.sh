#!/bin/bash
#
# Copyright (c) 2010-2019 Wanos Networks Pty(Ltd). All rights reserved.
#
# Modification of this software is not permitted under the licensing
# agreement. Please read the license as well as terms and conditions at
# http://wanos.co/license or email info@wanos.co for more information.
#

if [[ "$1" == "" ]]; then
	echo "No argument passed"
	exit -1
fi

case "$1" in
	-reboot)
	sudo reboot
	;;
	-poweroff)
	sudo poweroff
	;;
	-net)
	if [[ "$2" == "" ]]; then
		echo "No source file"
		exit -1
	fi
	if [ ! -f $2 ]; then
		echo "Invalid source file"
		exit -1
	fi
	sudo cp -f $2 /etc/netplan/50-cloud-init.yaml
	sudo netplan apply
	;;
	*)
	echo "Invalid command: ${1}"
	exit -1
	;;
esac