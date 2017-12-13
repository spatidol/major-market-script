const fetch = require("node-fetch");
const firebase = require('firebase/app')
require("firebase/database");
const fs = require('fs');

let json = require("./market-multiples"); 
let zipArray = Object.keys(json).sort(); 

const config = {
  apiKey: "AIzaSyBHop9qGYAMqwULXcEJiLEGL2hS8dXZ-dc",
  authDomain: "lyftaddressvalid-1502317118818.firebaseapp.com",
  databaseURL: "https://lyftaddressvalid-1502317118818.firebaseio.com",
  projectId: "lyftaddressvalid-1502317118818",
  storageBucket: "lyftaddressvalid-1502317118818.appspot.com",
  messagingSenderId: "262018765574"
};
firebase.initializeApp(config);

//firebase
const db = firebase.database();
const majorMarkets = db.ref(); 
const majorMarketsMultiples = db.ref("/zipToMultiples");

////write to new json w zips as key and major market as value
// let zipObjMultiples = {};

// marketsOnly.orderByKey().once('value') 
// .then(function(results){
// 	let object = results.val(); 
// 	for (var key in object) {
// 		for(let i=0; i < object[key].length; i++) {
// 			if (!zipObjMultiples[object[key][i]]) {
// 				zipObjMultiples[object[key][i]] = [key];
// 			} else {
// 				zipObjMultiples[object[key][i]].push(key)
// 			}
			
// 		}
// 	}
// 	zipObjMultiples = JSON.stringify(zipObjMultiples);
// 	fs.writeFile("market-multiples.json", zipObjMultiples);
// })


const hello = () => {
  return new Promise((resolve, reject) => {
    setTimeout(function(){
      resolve();
    }, 1500)
  })   
}

//pass a start & end key, will go through the zips and ping geocode to get town name then map major market to it
const mapping = (start, end, api) => {
	majorMarketsMultiples.orderByKey().startAt(start).endAt(end).once('value') 
	.then(async results => {
	  let obj = results.val()
	  console.log(obj)
	  for(var key in obj) {
	  	let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${key}&key=${api}`;
	    let place = obj[key];

	    (function(market, key) {
	    	fetch(url)
	    	.then(response => {
	    		return response.json();
	    	})
	    	.then(place => {
	    		let city = place.results[0].formatted_address.split(", ")
		      let state = city[1].split(" ")[0]; 
		      let newCity = `${city[0]}, ${state}, United States`; 
		      console.log(newCity)
		      console.log(market)
		      console.log(place.status)
		      db.ref(newCity).set({"market": market, "zip": key})
	    	})
	    	.catch(error => {
	    		console.log("error", error)
	    		db.ref("ERROR"+key).set(key)
	    	})
	    }(place, key));
	    await hello(); 
	  }
	})
}

//can pass array of zips that have errored and will generate those again 
const errorMapping = (array, api) => {
	for(let i=0; i < array.length; i++) {
		(function(i) {
			majorMarketsMultiples.orderByKey().equalTo(array[i]).once('value') 
			.then(async results => {
			  let obj = results.val()
		  	let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${array[i]}&key=${api}`;
		    let market = obj[array[i]];

	    	fetch(url)
	    	.then(response => {
	    		return response.json()
	    	})
	    	.then(place => {
	    		let city = place.results[0].formatted_address.split(", ")
		      let state = city[1].split(" ")[0]; 
		      let newCity = `${city[0]}, ${state}, United States`; 
		      console.log(place.status)
		      db.ref(newCity).set({"market": market, "zip": array[i]})
	    	})
	    	.catch(error => {
	    		console.log("error", error)
	    		db.ref("ERROR"+array[i]).set(array[i])
	    	})
			})	
		}(i))
	}
}
