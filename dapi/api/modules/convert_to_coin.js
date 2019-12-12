exports.convertToCoin = function(coinType , value) {
	var result
	switch(coinType) {
	case "btc":
		result = Float64Array(value) / 100000000
	case "eth":
		result = Float64Array(value) / 1000000000000000000
	case "":
		result = Float64Array(value) / 100000000
	}

	return result
}