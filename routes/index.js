var express = require('express');
var fs      = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var parser = require('xml2json');
var mysql = require('mysql');
var schedule = require('node-schedule');


app.get('/', function(req, res){
		    res.send('Check your Asshole!');
});


app.get('/scrape', function(req, res){

	var con = mysql.createConnection({
	  host: "localhost",
	  user: "root",
	  password: "root",
	  database: "mf_stock"
	});

	var result_link = "";
	con.connect(function(err) {
		if (err) throw err;
		var sql = "select rss_link from bank_detail";
		con.query(sql, function (err, result) {
		    if (err) throw err;
		    result.forEach(function(url){
			request(url.rss_link, function(error, response, html){
			    if(!error){
			    	var obj = parser.toJson(html);
				    var json = JSON.parse(obj);
					json.rss.channel.item.forEach(function(item){
				    
				    var values_html = item.description;
				    $ = cheerio.load(values_html);
				    var values = $('td').text().replace(/\s+/g, ' ').split(" ");

			    	var date_index = values.indexOf('Date') + 1;
			    	var date = GetDate(values[date_index]);

					item.title = item.title.replace("'","''")
					var sql = "select schem_id from schem_detail where schem_name='"+item.title+"' AND  !(update_date='"+date+"')";
					con.query(sql, function (err, result) {
					    if (err) throw err;
					    if(result){
						    result.forEach(function(schem){


						    	var nav_index = values.indexOf('NAV') + 1;
						    	var nav = isNaN(values[nav_index]) ? 0.0000: parseFloat(values[nav_index]); 

						    	var repurchase_index = values.indexOf('Repurchase') + 2;
						    	var repurchase_price = isNaN(values[repurchase_index]) ? 0.0000: parseFloat(values[nav_index]); 

						    	var sale_index = values.indexOf('Sale') + 2;
						    	var sale_price = isNaN(values[sale_index]) ? 0.0000: parseFloat(values[nav_index]); 

						    	var sql = "insert into nav_record (schem_id,nav,repurchase_price,sale_price,date) values ('"+parseInt(schem.schem_id)+"','"+nav+"','"+repurchase_price+"','"+sale_price+"','"+date+"')";
								con.query(sql, function (err, result) {
								    if (err) throw err;									
							    	console.log('Writing..............',schem.schem_id);
							    	var sql1 = "Update schem_detail SET update_date='"+date+"' WHERE schem_id='"+parseInt(schem.schem_id)+"'";
									con.query(sql1, function (err, result) {
									    if (err) throw err;									
								    	console.log('Updating the Update date..............',schem.schem_id);
									});	
								});							 
						    });
						}
						else{
								console.log('Record Not Found or Already Updated ....!!');
				     		// var sql = "insert into schem_detail (bank_id,schem_name,category) values ('"+url.bank_id+"','"+item.title+"','"+item.category+"')";
							// con.query(sql, function (err, result) {
							//     if (err) throw err;																		
							// });
						}
					});
					});		 
			  	}
			})
		})
	});
		    res.send('Check your console!');
	});
});

function GetDate(str) {
	var arr = str.split('-');
	var month = "";
	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	month = months.indexOf(arr[1])+1;
	if(month<10){month="0"+month};
	var formatddate = arr[2] + '-' + month + '-' + arr[0];
	return formatddate;
}


app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;