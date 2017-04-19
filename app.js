var express    = require('express');
var path       = require('path');
var logger     = require('morgan');
var bodyParser = require('body-parser');
var neo4j      = require('neo4j-driver').v1;

var app = express();

//View engine
app.set('views',path.join(__dirname,'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname,'public')));

var driver = neo4j.driver('bolt://localhost',
    neo4j.auth.basic('neo4j','osboxes.org'));
var session = driver.session();

app.get('/',function(req,res) {
  session
    .run('MATCH(n:Movie) RETURN n')
    .then(function(result) {
      var movieArr = [];
      result.records.forEach(function(record) {
        movieArr.push({
          id: record._fields[0].identity.low,
          title: record._fields[0].properties.title
        });
      });

      session
        .run('MATCH (n:Person) RETURN n')
        .then(function(result2){
           var personArr = [];
           result2.records.forEach(function(record) {
             personArr.push({
               id: record._fields[0].identity.low,
               name: record._fields[0].properties.name
             });
           });

           res.render('index', {
             movies: movieArr,
             persons: personArr
           });
        })
        .catch(function(err) {
          console.log(err);
        });

    })
    .catch(function(err) {
       console.log(err);
    });
});

app.get('/movies',function(req,res) {
  session
    .run('MATCH(n:Movie) RETURN n ')
    .then(function(result) {
      var movieArr = [];
      result.records.forEach(function(record) {
        movieArr.push({
          id: record._fields[0].identity.low,
          title: record._fields[0].properties.title,
          year: record._fields[0].properties.released
        });
		
      });
     
	 
		res.render('movie-list', {
		 movies: movieArr
	   });

    })
    .catch(function(err) {
       console.log(err);
    });
});

app.get('/persons',function(req,res) {
  session
    .run('MATCH(n:Person) RETURN n ')
    .then(function(result) {
      var personArr = [];
      result.records.forEach(function(record) {
        personArr.push({
		   id: record._fields[0].identity.low,
		   name: record._fields[0].properties.name
        });
		
      });
     
	 
		res.render('person-list', {
		 persons: personArr
	   });

    })
    .catch(function(err) {
       console.log(err);
    });
});

app.get('/movie/:movieID',function(req,res) {
  session
    .run('MATCH(n:Movie) where ID(n) = ' + req.params.movieID + ' RETURN n LIMIT 1')
    .then(function(result) {
      var movie = {
		  id: null,
          title: null,
          year: null,
		  tagline: null,
	  }
      result.records.forEach(function(record) {
        movie.id = record._fields[0].identity.low;
	    movie.title = record._fields[0].properties.title;
		movie.year = record._fields[0].properties.released;
		movie.tagline = record._fields[0].properties.tagline;
	  });
	  
	  session
        .run('MATCH (n:Person)-[:DIRECTED]->(b:Movie) where ID(b) =' + req.params.movieID + ' RETURN n')
        .then(function(result2){
           var directorsArr = [];
           result2.records.forEach(function(record) {
             directorsArr.push({
               id: record._fields[0].identity.low,
               name: record._fields[0].properties.name
             });
           });
		   
		   
			session
			.run('MATCH (n:Person)-[:ACTED_IN]->(b:Movie) where ID(b) =' + req.params.movieID + ' RETURN n')
			.then(function(result2){
			   var actorsArr = [];
			   result2.records.forEach(function(record) {
				 actorsArr.push({
				   id: record._fields[0].identity.low,
				   name: record._fields[0].properties.name
				 });
			   });

			   res.render('movie', {
				 movie: movie,
				 actors: actorsArr,
				 directors: directorsArr
			   });
			})
			.catch(function(err) {
			  console.log(err);
			});
		
		})
        .catch(function(err) {
          console.log(err);
        });
		

    })
    .catch(function(err) {
       console.log(err);
    });
});

app.post('/movie/:movieID/delete',function(req,res) {
   var id = req.params.movieID
  session
	.run('MATCH (n:Movie) where ID(n)='+id+' detach delete n')
    .then(function(result) {
      res.redirect('/movies');
      session.close();
    })
    .catch(function(err) {
      console.log(err)
    });
});

app.post('/person/:personID/delete',function(req,res) {
   var id = req.params.personID
  session
	.run('MATCH (n:Person) where ID(n)='+id+' detach delete n')
    .then(function(result) {
      res.redirect('/persons');
      session.close();
    })
    .catch(function(err) {
      console.log(err)
    });
});


app.get('/person/:personID',function(req,res) {
  session
    .run('MATCH(n:Person) where ID(n) = ' + req.params.personID + ' RETURN n LIMIT 1')
    .then(function(result) {
      var person = {
		  id: null,
          name: null,
          age: null,
          born: null
	  }
      result.records.forEach(function(record) {
        person.id = record._fields[0].identity.low;
	    person.name = record._fields[0].properties.name;
		person.age = record._fields[0].properties.age;
		person.born = record._fields[0].properties.born;
	  });
	  
	  session
        .run('MATCH (n:Person)-[:DIRECTED]->(b:Movie) where ID(n) =' + req.params.personID + ' RETURN b')
        .then(function(result2){
           var directedArr = [];
           result2.records.forEach(function(record) {
             directedArr.push({
               id: record._fields[0].identity.low,
               title: record._fields[0].properties.title
             });
           });
		   
		   
			session
			.run('MATCH (n:Person)-[:ACTED_IN]->(b:Movie) where ID(n) =' + req.params.personID + ' RETURN b')
			.then(function(result2){
			   var actedArr = [];
			   result2.records.forEach(function(record) {
				 actedArr.push({
				   id: record._fields[0].identity.low,
				   title: record._fields[0].properties.title
				 });
			   });

			   res.render('person', {
				 person: person,
				 acted: actedArr,
				 directed: directedArr
			   });
			})
			.catch(function(err) {
			  console.log(err);
			});
		
		})
        .catch(function(err) {
          console.log(err);
        });
		

    })
    .catch(function(err) {
       console.log(err);
    });
});

app.post('/movie/add',function(req,res) {
  var title = req.body.title;
  var year = req.body.year;
  var tagline = req.body.tagline;
  session
    .run('CREATE (n:Movie {title:{titleParam},released:{yearParam}, tagline:{taglineParam}}) RETURN n.title', {titleParam:title,yearParam:year, taglineParam:tagline})
    .then(function(result) {
      res.redirect('/movies');
      session.close();
    })
    .catch(function(err) {
      console.log(err)
    });
});

app.post('/movie/:movieID/update',function(req,res) {
  var id = req.params.movieID
  var title = req.body.title;
  var year = req.body.year;
  var tagline = req.body.tagline;
  session
	.run('MATCH (n:Movie) where ID(n)='+id+' set n += {title: {titleParam}, tagline: {tagParam}, released:{yearParam}} return n', 
		{
   		titleParam:title,
		tagParam:tagline,
		yearParam:year
	})
    .then(function(result) {
      res.redirect('/movie/'+id);
      session.close();
    })
    .catch(function(err) {
      console.log(err)
    });
});


app.post('/person/:personID/update',function(req,res) {
  var id = req.params.personID
  var name = req.body.name;
  var born = req.body.born;
  var age = req.body.age;
  session
	.run('MATCH (n:Person) where ID(n)='+id+' set n += {name: {nameParam}, born: {bornParam}, age:{ageParam}} return n', 
		{
		nameParam:name,
		bornParam:born,
		ageParam:age
		})
    .then(function(result) {
      res.redirect('/person/'+id);
      session.close();
    })
    .catch(function(err) {
      console.log(err)
    });
});


app.post('/movie/actor/add',function(req,res) {
  var title = req.body.title;
  var name = req.body.name;
  session
    .run('MATCH (p:Person {name:{nameParam}}),(m:Movie{title:{titleParam}}) MERGE (p)-[:ACTED_IN]-(m) RETURN p,m', {titleParam:title,nameParam:name})
    .then(function(result) {
      res.redirect('/');
      session.close();
    })
    .catch(function(err) {
      console.log(err)
    });
});

app.post('/person/add',function(req,res) {
  var name = req.body.name;
  var age = req.body.age;
  var born = req.body.born;
  session
    .run('CREATE (n:Person {name:{nameParam}, age:{ageParam}, born:{bornParam}}) RETURN n.name', 
		{
			nameParam:name,
			ageParam:age,
			bornParam:born,
		})
    .then(function(result) {
      res.redirect('/persons');
      session.close();
    })
    .catch(function(err) {
      console.log(err)
    });
});

app.listen(3000);
console.log('Server Started on Port 3000');

module.exports = app;
